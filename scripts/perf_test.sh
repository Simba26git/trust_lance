#!/bin/bash

# TrustLens Performance Test Script
# Tests the API's ability to handle concurrent uploads and analysis

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
API_KEY="${TEST_API_KEY:-your_test_api_key_here}"
CONCURRENT_UPLOADS="${CONCURRENT_UPLOADS:-100}"
TEST_DURATION="${TEST_DURATION:-60}"
TEST_IMAGE="${TEST_IMAGE:-test_images/genuine/sample1.jpg}"

echo "🚀 Starting TrustLens Performance Test"
echo "API URL: $API_URL"
echo "Concurrent uploads: $CONCURRENT_UPLOADS"
echo "Test duration: $TEST_DURATION seconds"
echo "Test image: $TEST_IMAGE"
echo ""

# Check if test image exists
if [ ! -f "$TEST_IMAGE" ]; then
    echo "❌ Test image not found: $TEST_IMAGE"
    echo "Please ensure test images are available or set TEST_IMAGE environment variable"
    exit 1
fi

# Check if API is accessible
echo "🔍 Checking API accessibility..."
if ! curl -s "$API_URL/health" > /dev/null; then
    echo "❌ API is not accessible at $API_URL"
    echo "Please ensure the TrustLens API is running"
    exit 1
fi

echo "✅ API is accessible"

# Create results directory
RESULTS_DIR="./performance_results/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo "📊 Results will be saved to: $RESULTS_DIR"

# Function to upload file and measure response time
upload_file() {
    local upload_id=$1
    local start_time=$(date +%s.%N)
    
    local response=$(curl -s -w "%{http_code},%{time_total}" \
        -X POST \
        -H "X-API-Key: $API_KEY" \
        -F "file=@$TEST_IMAGE" \
        "$API_URL/api/v1/uploads")
    
    local end_time=$(date +%s.%N)
    local http_code=$(echo "$response" | tail -c 8 | cut -d',' -f1)
    local time_total=$(echo "$response" | tail -c 8 | cut -d',' -f2)
    local response_body=$(echo "$response" | head -c -8)
    
    local duration=$(echo "$end_time - $start_time" | bc)
    
    echo "$upload_id,$http_code,$time_total,$duration,$(date +%s)" >> "$RESULTS_DIR/upload_results.csv"
    
    if [ "$http_code" = "200" ]; then
        local upload_uuid=$(echo "$response_body" | grep -o '"upload_id":"[^"]*"' | cut -d'"' -f4)
        echo "$upload_uuid" >> "$RESULTS_DIR/upload_ids.txt"
        echo "✅ Upload $upload_id: $http_code (${time_total}s)"
    else
        echo "❌ Upload $upload_id: $http_code (${time_total}s)"
    fi
}

# Function to check analysis status
check_analysis() {
    local upload_id=$1
    local start_time=$(date +%s.%N)
    
    local response=$(curl -s -w "%{http_code},%{time_total}" \
        -H "X-API-Key: $API_KEY" \
        "$API_URL/api/v1/analysis/$upload_id")
    
    local end_time=$(date +%s.%N)
    local http_code=$(echo "$response" | tail -c 8 | cut -d',' -f1)
    local time_total=$(echo "$response" | tail -c 8 | cut -d',' -f2)
    local response_body=$(echo "$response" | head -c -8)
    
    local duration=$(echo "$end_time - $start_time" | bc)
    
    echo "$upload_id,$http_code,$time_total,$duration,$(date +%s)" >> "$RESULTS_DIR/analysis_results.csv"
    
    if [ "$http_code" = "200" ]; then
        local verdict=$(echo "$response_body" | grep -o '"verdict":"[^"]*"' | cut -d'"' -f4)
        local score=$(echo "$response_body" | grep -o '"aggregated_score":[0-9]*' | cut -d':' -f2)
        echo "✅ Analysis $upload_id: $verdict (score: $score)"
        return 0
    elif [ "$http_code" = "202" ]; then
        echo "⏳ Analysis $upload_id: still processing"
        return 1
    else
        echo "❌ Analysis $upload_id: $http_code"
        return 1
    fi
}

# Initialize result files
echo "upload_id,http_code,time_total,duration,timestamp" > "$RESULTS_DIR/upload_results.csv"
echo "upload_id,http_code,time_total,duration,timestamp" > "$RESULTS_DIR/analysis_results.csv"
echo "" > "$RESULTS_DIR/upload_ids.txt"

# Phase 1: Concurrent uploads
echo ""
echo "📤 Phase 1: Concurrent uploads ($CONCURRENT_UPLOADS uploads)"
echo "Starting uploads..."

start_time=$(date +%s)

# Launch concurrent uploads
for i in $(seq 1 $CONCURRENT_UPLOADS); do
    upload_file $i &
    
    # Limit concurrent processes to avoid overwhelming the system
    if [ $((i % 20)) -eq 0 ]; then
        wait
    fi
done

# Wait for all uploads to complete
wait

end_time=$(date +%s)
upload_duration=$((end_time - start_time))

echo ""
echo "✅ Upload phase completed in ${upload_duration}s"

# Calculate upload statistics
total_uploads=$(wc -l < "$RESULTS_DIR/upload_results.csv")
total_uploads=$((total_uploads - 1)) # Subtract header
successful_uploads=$(awk -F',' '$2 == 200 {count++} END {print count+0}' "$RESULTS_DIR/upload_results.csv")
failed_uploads=$((total_uploads - successful_uploads))
upload_success_rate=$(echo "scale=2; $successful_uploads * 100 / $total_uploads" | bc)

echo "📊 Upload Statistics:"
echo "  Total uploads: $total_uploads"
echo "  Successful: $successful_uploads"
echo "  Failed: $failed_uploads"
echo "  Success rate: ${upload_success_rate}%"
echo "  Duration: ${upload_duration}s"
echo "  Throughput: $(echo "scale=2; $successful_uploads / $upload_duration" | bc) uploads/sec"

# Phase 2: Wait for analysis completion
echo ""
echo "🔍 Phase 2: Waiting for analysis completion"

analysis_start_time=$(date +%s)
max_wait_time=300  # 5 minutes maximum wait

while IFS= read -r upload_id; do
    if [ -n "$upload_id" ]; then
        # Wait up to max_wait_time for analysis to complete
        for attempt in $(seq 1 30); do  # 30 attempts with 10s intervals = 5 minutes
            if check_analysis "$upload_id"; then
                break
            fi
            
            current_time=$(date +%s)
            elapsed_time=$((current_time - analysis_start_time))
            
            if [ $elapsed_time -gt $max_wait_time ]; then
                echo "⏰ Timeout waiting for analysis completion"
                break 2
            fi
            
            sleep 10
        done
    fi
done < "$RESULTS_DIR/upload_ids.txt"

analysis_end_time=$(date +%s)
analysis_duration=$((analysis_end_time - analysis_start_time))

# Calculate analysis statistics
total_checks=$(wc -l < "$RESULTS_DIR/analysis_results.csv")
total_checks=$((total_checks - 1)) # Subtract header
completed_analyses=$(awk -F',' '$2 == 200 {count++} END {print count+0}' "$RESULTS_DIR/analysis_results.csv")
pending_analyses=$(awk -F',' '$2 == 202 {count++} END {print count+0}' "$RESULTS_DIR/analysis_results.csv")
failed_analyses=$(awk -F',' '$2 != 200 && $2 != 202 {count++} END {print count+0}' "$RESULTS_DIR/analysis_results.csv")

echo ""
echo "📊 Analysis Statistics:"
echo "  Total checks: $total_checks"
echo "  Completed: $completed_analyses"
echo "  Still pending: $pending_analyses"
echo "  Failed: $failed_analyses"
echo "  Duration: ${analysis_duration}s"

if [ $completed_analyses -gt 0 ]; then
    analysis_throughput=$(echo "scale=2; $completed_analyses / $analysis_duration" | bc)
    echo "  Throughput: ${analysis_throughput} analyses/sec"
fi

# Generate summary report
echo ""
echo "📋 Generating summary report..."

cat > "$RESULTS_DIR/summary.md" << EOF
# TrustLens Performance Test Results

**Test Configuration:**
- API URL: $API_URL
- Concurrent uploads: $CONCURRENT_UPLOADS
- Test duration: $TEST_DURATION seconds
- Test image: $TEST_IMAGE
- Timestamp: $(date)

## Upload Performance
- Total uploads: $total_uploads
- Successful: $successful_uploads
- Failed: $failed_uploads
- Success rate: ${upload_success_rate}%
- Duration: ${upload_duration}s
- Throughput: $(echo "scale=2; $successful_uploads / $upload_duration" | bc) uploads/sec

## Analysis Performance
- Total checks: $total_checks
- Completed: $completed_analyses
- Still pending: $pending_analyses
- Failed: $failed_analyses
- Duration: ${analysis_duration}s
EOF

if [ $completed_analyses -gt 0 ]; then
    echo "- Throughput: $(echo "scale=2; $completed_analyses / $analysis_duration" | bc) analyses/sec" >> "$RESULTS_DIR/summary.md"
fi

cat >> "$RESULTS_DIR/summary.md" << EOF

## Performance Criteria
- ✅ Target: 100 uploads/minute = 1.67 uploads/sec
- ✅ Target: Median latency < 5s for cheap path
- ✅ Target: Median latency < 15s for escalated path

## Files Generated
- \`upload_results.csv\` - Detailed upload performance data
- \`analysis_results.csv\` - Detailed analysis performance data
- \`upload_ids.txt\` - List of successful upload IDs
- \`summary.md\` - This summary report
EOF

echo "✅ Summary report saved to: $RESULTS_DIR/summary.md"

# Performance check against targets
upload_throughput=$(echo "scale=2; $successful_uploads / $upload_duration" | bc)
target_throughput=1.67

echo ""
echo "🎯 Performance Target Check:"

if [ $(echo "$upload_throughput >= $target_throughput" | bc) -eq 1 ]; then
    echo "✅ Upload throughput: ${upload_throughput} uploads/sec (target: 1.67 uploads/sec)"
else
    echo "❌ Upload throughput: ${upload_throughput} uploads/sec (target: 1.67 uploads/sec)"
fi

if [ $upload_success_rate -ge 95 ]; then
    echo "✅ Upload success rate: ${upload_success_rate}% (target: ≥95%)"
else
    echo "❌ Upload success rate: ${upload_success_rate}% (target: ≥95%)"
fi

echo ""
echo "🏁 Performance test completed!"
echo "📁 Results saved to: $RESULTS_DIR"
echo ""
echo "To view detailed results:"
echo "  cat $RESULTS_DIR/summary.md"
echo "  open $RESULTS_DIR/"
