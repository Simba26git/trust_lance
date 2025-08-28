#!/bin/bash

# TrustLens Deployment Script
# Handles deployment to different environments (staging, production)

set -e

# Configuration
ENVIRONMENT="${1:-staging}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-your-registry.com}"
PROJECT_NAME="trustlens"
VERSION="${VERSION:-$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')}"

echo "🚀 TrustLens Deployment Script"
echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"
echo "Docker Registry: $DOCKER_REGISTRY"
echo ""

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    echo "Usage: $0 <environment> [options]"
    exit 1
fi

# Load environment-specific configuration
case $ENVIRONMENT in
    "staging")
        NAMESPACE="trustlens-staging"
        DOMAIN="staging.trustlens.com"
        REPLICAS="2"
        RESOURCE_LIMITS="cpu=1000m,memory=2Gi"
        ;;
    "production")
        NAMESPACE="trustlens-prod"
        DOMAIN="app.trustlens.com"
        REPLICAS="5"
        RESOURCE_LIMITS="cpu=2000m,memory=4Gi"
        ;;
esac

echo "Deployment Configuration:"
echo "  Namespace: $NAMESPACE"
echo "  Domain: $DOMAIN"
echo "  Replicas: $REPLICAS"
echo "  Resources: $RESOURCE_LIMITS"
echo ""

# Function to build and push Docker images
build_and_push_images() {
    echo "🔨 Building and pushing Docker images..."
    
    # Build backend image
    echo "Building backend image..."
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-backend:$VERSION -f docker/Dockerfile.backend .
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-backend:$VERSION
    
    # Build worker image
    echo "Building worker image..."
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-worker:$VERSION -f docker/Dockerfile.worker .
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-worker:$VERSION
    
    # Build frontend image
    echo "Building frontend image..."
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-frontend:$VERSION -f docker/Dockerfile.frontend .
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-frontend:$VERSION
    
    echo "✅ Docker images built and pushed successfully"
}

# Function to update Kubernetes manifests
update_k8s_manifests() {
    echo "📝 Updating Kubernetes manifests..."
    
    # Create temporary directory for processed manifests
    TEMP_DIR=$(mktemp -d)
    
    # Process each manifest file
    for manifest in k8s/*.yaml; do
        if [ -f "$manifest" ]; then
            envsubst < "$manifest" > "$TEMP_DIR/$(basename $manifest)"
        fi
    done
    
    # Set environment variables for envsubst
    export ENVIRONMENT
    export NAMESPACE
    export DOMAIN
    export REPLICAS
    export VERSION
    export DOCKER_REGISTRY
    export PROJECT_NAME
    export RESOURCE_LIMITS
    
    echo "✅ Kubernetes manifests updated"
    echo "📁 Processed manifests saved to: $TEMP_DIR"
}

# Function to run database migrations
run_db_migrations() {
    echo "🗄️  Running database migrations..."
    
    # Create migration job
    kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: trustlens-migration-$VERSION
  namespace: $NAMESPACE
spec:
  template:
    spec:
      containers:
      - name: migration
        image: $DOCKER_REGISTRY/$PROJECT_NAME-backend:$VERSION
        command: ["npm", "run", "db:migrate"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: trustlens-secrets
              key: database-url
        - name: NODE_ENV
          value: "$ENVIRONMENT"
      restartPolicy: Never
  backoffLimit: 3
EOF
    
    # Wait for migration to complete
    echo "Waiting for database migration to complete..."
    kubectl wait --for=condition=complete job/trustlens-migration-$VERSION -n $NAMESPACE --timeout=300s
    
    if [ $? -eq 0 ]; then
        echo "✅ Database migration completed successfully"
        # Clean up migration job
        kubectl delete job trustlens-migration-$VERSION -n $NAMESPACE
    else
        echo "❌ Database migration failed"
        kubectl logs job/trustlens-migration-$VERSION -n $NAMESPACE
        exit 1
    fi
}

# Function to deploy to Kubernetes
deploy_to_k8s() {
    echo "☸️  Deploying to Kubernetes..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply all manifests
    kubectl apply -f $TEMP_DIR/ -n $NAMESPACE
    
    # Wait for deployments to be ready
    echo "Waiting for deployments to be ready..."
    
    kubectl rollout status deployment/trustlens-backend -n $NAMESPACE --timeout=600s
    kubectl rollout status deployment/trustlens-worker -n $NAMESPACE --timeout=600s
    kubectl rollout status deployment/trustlens-frontend -n $NAMESPACE --timeout=600s
    
    echo "✅ Kubernetes deployment completed successfully"
}

# Function to run health checks
run_health_checks() {
    echo "🔍 Running health checks..."
    
    # Get service URL
    if [ "$ENVIRONMENT" = "production" ]; then
        HEALTH_URL="https://$DOMAIN/health"
    else
        # For staging, get the load balancer IP
        LB_IP=$(kubectl get service trustlens-backend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
        HEALTH_URL="http://$LB_IP/health"
    fi
    
    echo "Health check URL: $HEALTH_URL"
    
    # Wait for service to be ready
    echo "Waiting for service to be ready..."
    for i in {1..30}; do
        if curl -s "$HEALTH_URL" > /dev/null; then
            echo "✅ Health check passed"
            
            # Run additional API tests
            echo "Running API endpoint tests..."
            
            # Test upload endpoint (without file)
            upload_status=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL/../api/v1/uploads" -X GET)
            if [ "$upload_status" = "401" ]; then
                echo "✅ Upload endpoint responding (401 expected without auth)"
            else
                echo "⚠️  Upload endpoint returned: $upload_status"
            fi
            
            # Test metrics endpoint
            metrics_status=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL/../metrics")
            if [ "$metrics_status" = "200" ]; then
                echo "✅ Metrics endpoint responding"
            else
                echo "⚠️  Metrics endpoint returned: $metrics_status"
            fi
            
            return 0
        fi
        
        echo "Attempt $i/30: Service not ready yet, waiting..."
        sleep 10
    done
    
    echo "❌ Health check failed after 5 minutes"
    
    # Show recent logs for debugging
    echo "Recent backend logs:"
    kubectl logs deployment/trustlens-backend -n $NAMESPACE --tail=20
    
    return 1
}

# Function to setup monitoring
setup_monitoring() {
    echo "📊 Setting up monitoring..."
    
    # Apply monitoring manifests
    kubectl apply -f k8s/monitoring/ -n $NAMESPACE
    
    # Wait for monitoring components
    kubectl rollout status deployment/prometheus -n $NAMESPACE --timeout=300s
    kubectl rollout status deployment/grafana -n $NAMESPACE --timeout=300s
    
    echo "✅ Monitoring setup completed"
}

# Function to create deployment summary
create_deployment_summary() {
    echo "📋 Creating deployment summary..."
    
    SUMMARY_FILE="deployment_$ENVIRONMENT_$VERSION.md"
    
    cat > $SUMMARY_FILE << EOF
# TrustLens Deployment Summary

**Environment:** $ENVIRONMENT  
**Version:** $VERSION  
**Timestamp:** $(date)  
**Namespace:** $NAMESPACE  
**Domain:** $DOMAIN  

## Deployment Details
- Backend replicas: $REPLICAS
- Worker replicas: $REPLICAS  
- Frontend replicas: $REPLICAS
- Resource limits: $RESOURCE_LIMITS

## Service URLs
- Main application: https://$DOMAIN
- Health check: https://$DOMAIN/health
- API documentation: https://$DOMAIN/api/docs
- Metrics: https://$DOMAIN/metrics

## Kubectl Commands
\`\`\`bash
# View pods
kubectl get pods -n $NAMESPACE

# View logs
kubectl logs deployment/trustlens-backend -n $NAMESPACE

# Port forward for debugging
kubectl port-forward service/trustlens-backend 3000:3000 -n $NAMESPACE
\`\`\`

## Rollback Command
\`\`\`bash
kubectl rollout undo deployment/trustlens-backend -n $NAMESPACE
kubectl rollout undo deployment/trustlens-worker -n $NAMESPACE
kubectl rollout undo deployment/trustlens-frontend -n $NAMESPACE
\`\`\`
EOF

    echo "✅ Deployment summary saved to: $SUMMARY_FILE"
}

# Function to rollback deployment
rollback_deployment() {
    echo "🔄 Rolling back deployment..."
    
    kubectl rollout undo deployment/trustlens-backend -n $NAMESPACE
    kubectl rollout undo deployment/trustlens-worker -n $NAMESPACE
    kubectl rollout undo deployment/trustlens-frontend -n $NAMESPACE
    
    # Wait for rollback to complete
    kubectl rollout status deployment/trustlens-backend -n $NAMESPACE
    kubectl rollout status deployment/trustlens-worker -n $NAMESPACE
    kubectl rollout status deployment/trustlens-frontend -n $NAMESPACE
    
    echo "✅ Rollback completed"
}

# Function to cleanup old deployments
cleanup_old_deployments() {
    echo "🧹 Cleaning up old deployments..."
    
    # Keep last 5 replica sets
    kubectl patch deployment trustlens-backend -n $NAMESPACE -p '{"spec":{"revisionHistoryLimit":5}}'
    kubectl patch deployment trustlens-worker -n $NAMESPACE -p '{"spec":{"revisionHistoryLimit":5}}'
    kubectl patch deployment trustlens-frontend -n $NAMESPACE -p '{"spec":{"revisionHistoryLimit":5}}'
    
    # Clean up old migration jobs
    kubectl delete job --selector=app=trustlens-migration -n $NAMESPACE --ignore-not-found
    
    echo "✅ Cleanup completed"
}

# Pre-deployment checks
pre_deployment_checks() {
    echo "🔍 Running pre-deployment checks..."
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        echo "❌ kubectl not found. Please install kubectl."
        exit 1
    fi
    
    # Check if connected to correct cluster
    CURRENT_CONTEXT=$(kubectl config current-context)
    echo "Current kubectl context: $CURRENT_CONTEXT"
    
    read -p "Is this the correct cluster for $ENVIRONMENT deployment? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Deployment cancelled. Please switch to the correct cluster."
        exit 1
    fi
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found. Please install Docker."
        exit 1
    fi
    
    # Check if logged into Docker registry
    if ! docker info &> /dev/null; then
        echo "❌ Docker daemon not running or not accessible."
        exit 1
    fi
    
    echo "✅ Pre-deployment checks passed"
}

# Main deployment flow
main() {
    case "${2:-deploy}" in
        "build-only")
            pre_deployment_checks
            build_and_push_images
            ;;
        "deploy-only")
            update_k8s_manifests
            deploy_to_k8s
            run_health_checks
            create_deployment_summary
            ;;
        "rollback")
            rollback_deployment
            ;;
        "cleanup")
            cleanup_old_deployments
            ;;
        "deploy"|*)
            pre_deployment_checks
            build_and_push_images
            update_k8s_manifests
            run_db_migrations
            deploy_to_k8s
            
            if [ "$ENVIRONMENT" = "production" ]; then
                setup_monitoring
            fi
            
            run_health_checks
            create_deployment_summary
            cleanup_old_deployments
            
            echo ""
            echo "🎉 Deployment completed successfully!"
            echo "📱 Application URL: https://$DOMAIN"
            echo "📋 Deployment summary: $SUMMARY_FILE"
            ;;
    esac
}

# Help message
if [ "${1:-}" = "help" ] || [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    echo "🚀 TrustLens Deployment Script"
    echo ""
    echo "Usage: $0 <environment> [action]"
    echo ""
    echo "Environments:"
    echo "  staging    - Deploy to staging environment"
    echo "  production - Deploy to production environment"
    echo ""
    echo "Actions:"
    echo "  deploy     - Full deployment (default)"
    echo "  build-only - Build and push images only"
    echo "  deploy-only- Deploy without building images"
    echo "  rollback   - Rollback to previous version"
    echo "  cleanup    - Clean up old deployments"
    echo ""
    echo "Environment Variables:"
    echo "  DOCKER_REGISTRY - Docker registry URL"
    echo "  VERSION         - Deployment version tag"
    echo ""
    echo "Examples:"
    echo "  $0 staging                    # Deploy to staging"
    echo "  $0 production                 # Deploy to production"
    echo "  $0 staging build-only         # Build images only"
    echo "  VERSION=v1.2.3 $0 production # Deploy specific version"
    echo ""
    exit 0
fi

# Run main function
main "$@"
