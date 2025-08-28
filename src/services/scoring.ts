// TrustLens - Scoring Algorithm Service
// Calculates authenticity scores based on multiple analysis factors

import { logger } from '../utils/logger';

export interface AnalysisInputs {
  c2pa_verification?: {
    verified: boolean;
    manifest_present: boolean;
    signature_valid: boolean;
    issuer?: string;
  };
  deepfake_detection?: {
    score: number;
    confidence: number;
    detected_faces: number;
    technology_used: string;
  };
  reverse_image_search?: {
    matches_found: number;
    suspicious_sources: number;
    earliest_occurrence?: Date;
    sources: Array<{
      url: string;
      similarity: number;
      risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    }>;
  };
  metadata_analysis?: {
    camera_info?: string;
    software_used?: string;
    gps_location?: string;
    timestamp_consistency: boolean;
    editing_detected: boolean;
    suspicious_indicators: string[];
  };
}

export interface ScoringResult {
  aggregated_score: number; // 0-100, higher is more authentic
  verdict: 'GENUINE' | 'SUSPICIOUS' | 'FAKE';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0-100, confidence in the verdict
  factor_scores: {
    c2pa_score: number;
    deepfake_score: number;
    reverse_search_score: number;
    metadata_score: number;
  };
  factor_weights: {
    c2pa_weight: number;
    deepfake_weight: number;
    reverse_search_weight: number;
    metadata_weight: number;
  };
  risk_factors: string[];
  positive_indicators: string[];
  reasoning: string;
}

export class ScoringService {
  private static instance: ScoringService;

  // Base weights for different analysis factors
  private readonly baseWeights = {
    c2pa_weight: 0.35,        // 35% - Cryptographic verification is strongest
    deepfake_weight: 0.30,    // 30% - AI detection is very important
    reverse_search_weight: 0.20, // 20% - Content originality matters
    metadata_weight: 0.15     // 15% - Technical metadata provides context
  };

  // Thresholds for verdict determination
  private readonly verdictThresholds = {
    genuine_threshold: 70,    // Score >= 70 is genuine
    suspicious_threshold: 40  // Score 40-69 is suspicious, <40 is fake
  };

  public static getInstance(): ScoringService {
    if (!ScoringService.instance) {
      ScoringService.instance = new ScoringService();
    }
    return ScoringService.instance;
  }

  /**
   * Calculate comprehensive authenticity score
   */
  calculateScore(
    inputs: AnalysisInputs,
    uploadId: string,
    fileType: 'image' | 'video'
  ): ScoringResult {
    try {
      logger.info('Calculating authenticity score', { uploadId, fileType });

      // Calculate individual factor scores
      const factorScores = {
        c2pa_score: this.calculateC2PAScore(inputs.c2pa_verification),
        deepfake_score: this.calculateDeepfakeScore(inputs.deepfake_detection),
        reverse_search_score: this.calculateReverseSearchScore(inputs.reverse_image_search),
        metadata_score: this.calculateMetadataScore(inputs.metadata_analysis)
      };

      // Adjust weights based on available data and file type
      const adjustedWeights = this.adjustWeights(inputs, fileType);

      // Calculate weighted aggregated score
      const aggregatedScore = this.calculateWeightedScore(factorScores, adjustedWeights);

      // Determine verdict and risk level
      const verdict = this.determineVerdict(aggregatedScore);
      const riskLevel = this.determineRiskLevel(aggregatedScore, inputs);

      // Calculate confidence based on data availability and consistency
      const confidence = this.calculateConfidence(inputs, factorScores);

      // Collect risk factors and positive indicators
      const riskFactors = this.collectRiskFactors(inputs);
      const positiveIndicators = this.collectPositiveIndicators(inputs);

      // Generate human-readable reasoning
      const reasoning = this.generateReasoning(factorScores, adjustedWeights, verdict);

      const result: ScoringResult = {
        aggregated_score: Math.round(aggregatedScore),
        verdict,
        risk_level: riskLevel,
        confidence: Math.round(confidence),
        factor_scores: factorScores,
        factor_weights: adjustedWeights,
        risk_factors: riskFactors,
        positive_indicators: positiveIndicators,
        reasoning
      };

      logger.info('Authenticity score calculated', {
        uploadId,
        score: result.aggregated_score,
        verdict: result.verdict,
        riskLevel: result.risk_level,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      logger.error('Failed to calculate authenticity score', { uploadId, error });
      
      // Return conservative score on error
      return {
        aggregated_score: 50,
        verdict: 'SUSPICIOUS',
        risk_level: 'MEDIUM',
        confidence: 20,
        factor_scores: {
          c2pa_score: 50,
          deepfake_score: 50,
          reverse_search_score: 50,
          metadata_score: 50
        },
        factor_weights: this.baseWeights,
        risk_factors: ['Scoring calculation failed'],
        positive_indicators: [],
        reasoning: 'Unable to calculate reliable score due to technical error'
      };
    }
  }

  /**
   * Calculate C2PA verification score
   */
  private calculateC2PAScore(c2pa?: AnalysisInputs['c2pa_verification']): number {
    if (!c2pa) {
      return 50; // Neutral score when no C2PA data available
    }

    let score = 50; // Start with neutral

    // Strong positive indicators
    if (c2pa.verified && c2pa.manifest_present && c2pa.signature_valid) {
      score = 95; // Very high confidence in authenticity
      
      // Bonus for known trusted issuer
      if (c2pa.issuer && this.isTrustedIssuer(c2pa.issuer)) {
        score = 98;
      }
    }
    // Partial verification
    else if (c2pa.manifest_present && c2pa.signature_valid) {
      score = 80; // Good authenticity indication
    }
    // Manifest present but signature issues
    else if (c2pa.manifest_present && !c2pa.signature_valid) {
      score = 30; // Potential tampering
    }
    // No C2PA data at all
    else if (!c2pa.manifest_present) {
      score = 45; // Slightly suspicious in professional context
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate deepfake detection score
   */
  private calculateDeepfakeScore(deepfake?: AnalysisInputs['deepfake_detection']): number {
    if (!deepfake) {
      return 50; // Neutral score when no deepfake analysis available
    }

    // Convert deepfake probability to authenticity score
    // High deepfake score = low authenticity score
    let authenticityScore = 100 - deepfake.score;

    // Adjust based on confidence
    const confidenceMultiplier = deepfake.confidence / 100;
    authenticityScore = 50 + (authenticityScore - 50) * confidenceMultiplier;

    // Slight penalty for multiple faces (higher manipulation risk)
    if (deepfake.detected_faces > 2) {
      authenticityScore -= 5;
    }

    // Bonus for no faces detected (less manipulation risk)
    if (deepfake.detected_faces === 0) {
      authenticityScore += 10;
    }

    return Math.max(0, Math.min(100, authenticityScore));
  }

  /**
   * Calculate reverse search score
   */
  private calculateReverseSearchScore(reverseSearch?: AnalysisInputs['reverse_image_search']): number {
    if (!reverseSearch) {
      return 60; // Slightly positive when no reverse search data (original might be good)
    }

    let score = 70; // Start with positive assumption

    // Penalty for matches found
    if (reverseSearch.matches_found > 0) {
      // More matches = more suspicious
      const matchPenalty = Math.min(30, reverseSearch.matches_found * 3);
      score -= matchPenalty;
    }

    // Heavy penalty for suspicious sources
    if (reverseSearch.suspicious_sources > 0) {
      const suspiciousPenalty = reverseSearch.suspicious_sources * 15;
      score -= suspiciousPenalty;
    }

    // Analyze source risk levels
    const criticalSources = reverseSearch.sources?.filter(s => s.risk_level === 'CRITICAL').length || 0;
    const highRiskSources = reverseSearch.sources?.filter(s => s.risk_level === 'HIGH').length || 0;

    score -= criticalSources * 20;
    score -= highRiskSources * 10;

    // Check for very early occurrences (might indicate stolen content)
    if (reverseSearch.earliest_occurrence) {
      const daysSinceEarliest = (Date.now() - reverseSearch.earliest_occurrence.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceEarliest > 365) { // More than a year old
        score -= 15;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate metadata analysis score
   */
  private calculateMetadataScore(metadata?: AnalysisInputs['metadata_analysis']): number {
    if (!metadata) {
      return 50; // Neutral score when no metadata available
    }

    let score = 60; // Start with slightly positive

    // Positive indicators
    if (metadata.camera_info && this.isLegitimateCamera(metadata.camera_info)) {
      score += 15;
    }

    if (metadata.gps_location) {
      score += 10; // GPS data usually indicates authentic capture
    }

    if (metadata.timestamp_consistency) {
      score += 10;
    }

    // Negative indicators
    if (metadata.editing_detected) {
      score -= 20; // Editing significantly reduces authenticity
    }

    if (!metadata.timestamp_consistency) {
      score -= 15; // Timestamp issues are suspicious
    }

    // Suspicious indicators penalty
    const suspiciousCount = metadata.suspicious_indicators?.length || 0;
    score -= suspiciousCount * 5;

    // Software analysis
    if (metadata.software_used) {
      if (this.isProfessionalEditingSoftware(metadata.software_used)) {
        score -= 15; // Professional editing tools indicate manipulation
      } else if (this.isLegitimateImageSoftware(metadata.software_used)) {
        score += 5; // Basic camera software is positive
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Adjust weights based on available data and file type
   */
  private adjustWeights(inputs: AnalysisInputs, fileType: 'image' | 'video'): ScoringResult['factor_weights'] {
    const weights = { ...this.baseWeights };

    // Adjust for video vs image
    if (fileType === 'video') {
      weights.deepfake_weight += 0.1; // Deepfake detection more important for videos
      weights.metadata_weight -= 0.05;
      weights.reverse_search_weight -= 0.05;
    }

    // Boost C2PA weight when available and reliable
    if (inputs.c2pa_verification?.verified) {
      weights.c2pa_weight += 0.1;
      weights.deepfake_weight -= 0.05;
      weights.metadata_weight -= 0.05;
    }

    // Boost deepfake weight when high confidence
    if (inputs.deepfake_detection?.confidence && inputs.deepfake_detection.confidence > 80) {
      weights.deepfake_weight += 0.05;
      weights.metadata_weight -= 0.05;
    }

    // Reduce reverse search weight if no matches found (not very informative)
    if (inputs.reverse_image_search?.matches_found === 0) {
      weights.reverse_search_weight *= 0.5;
      
      // Redistribute weight to other factors
      const redistribution = weights.reverse_search_weight * 0.5;
      weights.c2pa_weight += redistribution * 0.4;
      weights.deepfake_weight += redistribution * 0.4;
      weights.metadata_weight += redistribution * 0.2;
    }

    // Normalize weights to sum to 1
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(weights).forEach(key => {
      weights[key as keyof typeof weights] = weights[key as keyof typeof weights] / totalWeight;
    });

    return weights;
  }

  /**
   * Calculate weighted aggregated score
   */
  private calculateWeightedScore(
    factorScores: ScoringResult['factor_scores'],
    weights: ScoringResult['factor_weights']
  ): number {
    return (
      factorScores.c2pa_score * weights.c2pa_weight +
      factorScores.deepfake_score * weights.deepfake_weight +
      factorScores.reverse_search_score * weights.reverse_search_weight +
      factorScores.metadata_score * weights.metadata_weight
    );
  }

  /**
   * Determine verdict based on score
   */
  private determineVerdict(score: number): 'GENUINE' | 'SUSPICIOUS' | 'FAKE' {
    if (score >= this.verdictThresholds.genuine_threshold) {
      return 'GENUINE';
    } else if (score >= this.verdictThresholds.suspicious_threshold) {
      return 'SUSPICIOUS';
    } else {
      return 'FAKE';
    }
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(
    score: number,
    inputs: AnalysisInputs
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Base risk level on score
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    
    if (score >= 80) {
      riskLevel = 'LOW';
    } else if (score >= 60) {
      riskLevel = 'MEDIUM';
    } else if (score >= 30) {
      riskLevel = 'HIGH';
    } else {
      riskLevel = 'CRITICAL';
    }

    // Escalate risk based on specific indicators
    if (inputs.deepfake_detection?.score && inputs.deepfake_detection.score > 80) {
      riskLevel = 'CRITICAL'; // High deepfake probability always critical
    }

    if (inputs.reverse_image_search?.suspicious_sources && inputs.reverse_image_search.suspicious_sources > 3) {
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
      if (riskLevel === 'MEDIUM') riskLevel = 'HIGH';
    }

    if (inputs.c2pa_verification?.manifest_present && !inputs.c2pa_verification.signature_valid) {
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
      // Tampered C2PA is serious but not necessarily critical
    }

    return riskLevel;
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(inputs: AnalysisInputs, factorScores: ScoringResult['factor_scores']): number {
    let confidence = 0;
    let factorsAvailable = 0;

    // Add confidence based on available analysis factors
    if (inputs.c2pa_verification) {
      factorsAvailable++;
      confidence += inputs.c2pa_verification.verified ? 90 : 70;
    }

    if (inputs.deepfake_detection) {
      factorsAvailable++;
      confidence += inputs.deepfake_detection.confidence || 50;
    }

    if (inputs.reverse_image_search) {
      factorsAvailable++;
      confidence += inputs.reverse_image_search.matches_found > 0 ? 80 : 60;
    }

    if (inputs.metadata_analysis) {
      factorsAvailable++;
      const suspiciousCount = inputs.metadata_analysis.suspicious_indicators?.length || 0;
      confidence += Math.max(40, 80 - suspiciousCount * 10);
    }

    // Average confidence across available factors
    const baseConfidence = factorsAvailable > 0 ? confidence / factorsAvailable : 50;

    // Bonus for having multiple analysis factors
    const factorBonus = Math.min(20, factorsAvailable * 5);

    // Penalty for conflicting results
    const scores = Object.values(factorScores);
    const scoreRange = Math.max(...scores) - Math.min(...scores);
    const conflictPenalty = scoreRange > 40 ? 15 : 0;

    return Math.max(20, Math.min(100, baseConfidence + factorBonus - conflictPenalty));
  }

  /**
   * Collect risk factors from analysis inputs
   */
  private collectRiskFactors(inputs: AnalysisInputs): string[] {
    const riskFactors: string[] = [];

    // C2PA risks
    if (inputs.c2pa_verification?.manifest_present && !inputs.c2pa_verification.signature_valid) {
      riskFactors.push('C2PA signature verification failed - potential tampering');
    }

    // Deepfake risks
    if (inputs.deepfake_detection?.score && inputs.deepfake_detection.score > 70) {
      riskFactors.push(`High deepfake probability detected (${inputs.deepfake_detection.score}%)`);
    }

    // Reverse search risks
    if (inputs.reverse_image_search?.suspicious_sources && inputs.reverse_image_search.suspicious_sources > 0) {
      riskFactors.push(`Found ${inputs.reverse_image_search.suspicious_sources} matches on suspicious websites`);
    }

    // Metadata risks
    if (inputs.metadata_analysis?.editing_detected) {
      riskFactors.push('Image editing software detected in metadata');
    }

    if (inputs.metadata_analysis?.suspicious_indicators) {
      riskFactors.push(...inputs.metadata_analysis.suspicious_indicators);
    }

    return riskFactors;
  }

  /**
   * Collect positive indicators from analysis inputs
   */
  private collectPositiveIndicators(inputs: AnalysisInputs): string[] {
    const positiveIndicators: string[] = [];

    // C2PA positive indicators
    if (inputs.c2pa_verification?.verified) {
      positiveIndicators.push('Content authenticity verified by C2PA standard');
    }

    // Deepfake positive indicators
    if (inputs.deepfake_detection?.score && inputs.deepfake_detection.score < 30) {
      positiveIndicators.push('Low probability of deepfake manipulation');
    }

    // Reverse search positive indicators
    if (inputs.reverse_image_search?.matches_found === 0) {
      positiveIndicators.push('No duplicate images found on the web');
    }

    // Metadata positive indicators
    if (inputs.metadata_analysis?.camera_info && this.isLegitimateCamera(inputs.metadata_analysis.camera_info)) {
      positiveIndicators.push(`Captured with legitimate camera: ${inputs.metadata_analysis.camera_info}`);
    }

    if (inputs.metadata_analysis?.timestamp_consistency) {
      positiveIndicators.push('Consistent timestamp information');
    }

    if (inputs.metadata_analysis?.gps_location) {
      positiveIndicators.push('GPS location data present');
    }

    return positiveIndicators;
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    factorScores: ScoringResult['factor_scores'],
    weights: ScoringResult['factor_weights'],
    verdict: 'GENUINE' | 'SUSPICIOUS' | 'FAKE'
  ): string {
    const parts: string[] = [];

    // Verdict explanation
    if (verdict === 'GENUINE') {
      parts.push('This content appears to be authentic based on multiple verification factors.');
    } else if (verdict === 'SUSPICIOUS') {
      parts.push('This content shows some concerning patterns that warrant further investigation.');
    } else {
      parts.push('This content exhibits multiple indicators of manipulation or fabrication.');
    }

    // Factor contributions
    const sortedFactors = Object.entries(factorScores)
      .map(([factor, score]) => ({
        factor: factor.replace('_score', '').replace('_', ' '),
        score,
        weight: weights[factor.replace('score', 'weight') as keyof typeof weights]
      }))
      .sort((a, b) => (b.score * b.weight) - (a.score * a.weight));

    parts.push(
      `Primary analysis factors: ${sortedFactors[0].factor} (${Math.round(sortedFactors[0].score)}%), ` +
      `${sortedFactors[1].factor} (${Math.round(sortedFactors[1].score)}%).`
    );

    return parts.join(' ');
  }

  /**
   * Check if issuer is trusted
   */
  private isTrustedIssuer(issuer: string): boolean {
    const trustedIssuers = [
      'Adobe', 'Canon', 'Nikon', 'Sony', 'Apple', 'Samsung',
      'Google', 'Microsoft', 'Leica', 'Fujifilm', 'Olympus'
    ];
    
    return trustedIssuers.some(trusted => 
      issuer.toLowerCase().includes(trusted.toLowerCase())
    );
  }

  /**
   * Check if camera is legitimate
   */
  private isLegitimateCamera(cameraInfo: string): boolean {
    const legitimateBrands = [
      'Canon', 'Nikon', 'Sony', 'Fujifilm', 'Olympus', 'Panasonic',
      'Leica', 'Pentax', 'Apple', 'Samsung', 'Google', 'Huawei'
    ];
    
    return legitimateBrands.some(brand => 
      cameraInfo.toLowerCase().includes(brand.toLowerCase())
    );
  }

  /**
   * Check if software is professional editing software
   */
  private isProfessionalEditingSoftware(software: string): boolean {
    const professionalSoftware = [
      'Photoshop', 'Lightroom', 'GIMP', 'Affinity Photo',
      'Capture One', 'Luminar', 'Skylum', 'DxO'
    ];
    
    return professionalSoftware.some(pro => 
      software.toLowerCase().includes(pro.toLowerCase())
    );
  }

  /**
   * Check if software is legitimate camera/basic image software
   */
  private isLegitimateImageSoftware(software: string): boolean {
    const legitimateSoftware = [
      'Camera', 'Photos', 'Gallery', 'Image Capture',
      'Canon', 'Nikon', 'Sony', 'Olympus'
    ];
    
    return legitimateSoftware.some(legit => 
      software.toLowerCase().includes(legit.toLowerCase())
    );
  }
}
