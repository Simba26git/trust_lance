/**
 * TrustLens Authenticity Scoring Algorithm
 * 
 * This module implements the core scoring logic for determining
 * the authenticity of uploaded images and videos.
 */

export interface ScoringInputs {
  // C2PA and Provenance Data
  c2paFound: boolean;
  c2paIssuer?: string;
  c2paSignedDate?: Date;
  truepicVerified?: boolean;
  
  // EXIF Metadata
  exifPresent: boolean;
  exifFields?: Record<string, any>;
  exifConsistent: boolean;
  
  // Visual Similarity Analysis
  phashMatches: Array<{
    url: string;
    hammingDistance: number;
    source: string;
  }>;
  reverseImageMatches: Array<{
    url: string;
    confidence: number;
    source: string;
  }>;
  
  // Deepfake Detection
  deepfakeScore?: number; // 0.0 to 1.0 (probability of being fake)
  deepfakeProvider?: string;
  
  // Seller Identity
  sellerIdentityScore?: number; // 0.0 to 1.0
  
  // Heuristics
  suspiciousAspectRatio: boolean;
  lowResolutionUpscale: boolean;
  hasWatermarks: boolean;
  multipleUploadsFromIP: boolean;
  
  // Manual Override
  manualOverride?: number; // 0 or 1
}

export interface ScoringResult {
  aggregatedScore: number; // 0 to 100
  verdict: 'safe' | 'caution' | 'suspect';
  breakdown: {
    provenanceScore: number;
    visualSimilarityScore: number;
    deepfakeNegScore: number;
    sellerIdentityScore: number;
    heuristicsScore: number;
    manualOverrideScore: number;
  };
  evidence: Array<{
    source: string;
    result: any;
    weight: number;
    contributes: number; // How much this contributed to final score
  }>;
  confidence: number; // 0.0 to 1.0 - confidence in the scoring
}

/**
 * Calculate provenance score based on C2PA, TruePic, and EXIF data
 */
function calculateProvenanceScore(inputs: ScoringInputs): number {
  // Perfect provenance: Valid C2PA signature from trusted issuer
  if (inputs.c2paFound && inputs.c2paIssuer) {
    const trustedIssuers = ['truepic.com', 'adobe.com', 'leica.com', 'canon.com'];
    if (trustedIssuers.some(issuer => inputs.c2paIssuer!.includes(issuer))) {
      return 1.0;
    }
    // C2PA present but from unknown issuer
    return 0.8;
  }
  
  // TruePic verification (high confidence)
  if (inputs.truepicVerified) {
    return 0.9;
  }
  
  // EXIF metadata present and consistent
  if (inputs.exifPresent && inputs.exifConsistent) {
    return 0.5;
  }
  
  // EXIF present but inconsistent or suspicious
  if (inputs.exifPresent && !inputs.exifConsistent) {
    return 0.2;
  }
  
  // No provenance data
  return 0.0;
}

/**
 * Calculate visual similarity score based on pHash and reverse image search
 */
function calculateVisualSimilarityScore(inputs: ScoringInputs): number {
  let score = 1.0; // Start with perfect score
  
  // Check pHash matches (exact or near-exact duplicates)
  if (inputs.phashMatches.length > 0) {
    const closestMatch = Math.min(...inputs.phashMatches.map(m => m.hammingDistance));
    
    // Hamming distance 0-2: Exact or near-exact match
    if (closestMatch <= 2) {
      // Check if it's a match to the merchant's own catalog
      const isCatalogMatch = inputs.phashMatches.some(m => 
        m.source === 'merchant_catalog' || m.source === 'product_database'
      );
      
      if (isCatalogMatch) {
        return 1.0; // Perfect match to legitimate product
      } else {
        return 0.0; // Exact match to external source (likely stolen)
      }
    }
    
    // Hamming distance 3-8: Similar image
    if (closestMatch <= 8) {
      score *= 0.3; // Penalize heavily for similar images
    }
  }
  
  // Check reverse image search results
  if (inputs.reverseImageMatches.length > 0) {
    const highConfidenceMatches = inputs.reverseImageMatches.filter(m => m.confidence > 0.8);
    
    if (highConfidenceMatches.length > 0) {
      // Multiple high-confidence matches suggest stolen image
      if (highConfidenceMatches.length >= 3) {
        score *= 0.1;
      } else {
        score *= 0.4;
      }
    }
    
    // Moderate confidence matches
    const moderateMatches = inputs.reverseImageMatches.filter(m => m.confidence > 0.6);
    if (moderateMatches.length > 2) {
      score *= 0.6;
    }
  }
  
  return Math.max(0, score);
}

/**
 * Calculate deepfake detection score (inverted)
 */
function calculateDeepfakeNegScore(inputs: ScoringInputs): number {
  if (inputs.deepfakeScore === undefined) {
    return 0.5; // Neutral score when deepfake detection not available
  }
  
  // Invert the score: lower deepfake probability = higher authenticity
  return 1.0 - inputs.deepfakeScore;
}

/**
 * Calculate seller identity score
 */
function calculateSellerIdentityScore(inputs: ScoringInputs): number {
  return inputs.sellerIdentityScore || 0.5; // Default neutral if not available
}

/**
 * Calculate heuristics-based score
 */
function calculateHeuristicsScore(inputs: ScoringInputs): number {
  let score = 1.0;
  let penalties = 0;
  
  // Suspicious aspect ratio (e.g., screenshot artifacts)
  if (inputs.suspiciousAspectRatio) {
    penalties += 0.2;
  }
  
  // Low resolution upscale (AI-generated images often have this)
  if (inputs.lowResolutionUpscale) {
    penalties += 0.3;
  }
  
  // Watermarks can indicate stock photos or copyrighted content
  if (inputs.hasWatermarks) {
    penalties += 0.4;
  }
  
  // Multiple uploads from same IP in short time
  if (inputs.multipleUploadsFromIP) {
    penalties += 0.1;
  }
  
  return Math.max(0, score - penalties);
}

/**
 * Main scoring function
 */
export function calculateAuthenticityScore(inputs: ScoringInputs): ScoringResult {
  // Calculate individual component scores
  const provenanceScore = calculateProvenanceScore(inputs);
  const visualSimilarityScore = calculateVisualSimilarityScore(inputs);
  const deepfakeNegScore = calculateDeepfakeNegScore(inputs);
  const sellerIdentityScore = calculateSellerIdentityScore(inputs);
  const heuristicsScore = calculateHeuristicsScore(inputs);
  const manualOverrideScore = inputs.manualOverride || 0;
  
  // Weighted scoring formula
  const weights = {
    provenance: 0.25,
    visualSimilarity: 0.20,
    deepfakeNeg: 0.20,
    sellerIdentity: 0.15,
    heuristics: 0.10,
    manualOverride: 0.10,
  };
  
  // Calculate final score
  const rawScore = 
    weights.provenance * provenanceScore +
    weights.visualSimilarity * visualSimilarityScore +
    weights.deepfakeNeg * deepfakeNegScore +
    weights.sellerIdentity * sellerIdentityScore +
    weights.heuristics * heuristicsScore +
    weights.manualOverride * manualOverrideScore;
  
  const aggregatedScore = Math.round(rawScore * 100);
  
  // Determine verdict based on score thresholds
  let verdict: 'safe' | 'caution' | 'suspect';
  if (aggregatedScore >= 85) {
    verdict = 'safe';
  } else if (aggregatedScore >= 60) {
    verdict = 'caution';
  } else {
    verdict = 'suspect';
  }
  
  // Calculate confidence based on data availability
  let confidence = 0.5; // Base confidence
  
  if (inputs.c2paFound || inputs.truepicVerified) confidence += 0.3;
  if (inputs.deepfakeScore !== undefined) confidence += 0.2;
  if (inputs.phashMatches.length > 0 || inputs.reverseImageMatches.length > 0) confidence += 0.2;
  if (inputs.exifPresent) confidence += 0.1;
  
  confidence = Math.min(1.0, confidence);
  
  // Build evidence array
  const evidence = [
    {
      source: 'c2pa',
      result: {
        found: inputs.c2paFound,
        issuer: inputs.c2paIssuer,
        signedDate: inputs.c2paSignedDate,
      },
      weight: weights.provenance,
      contributes: weights.provenance * provenanceScore * 100,
    },
    {
      source: 'phash',
      result: {
        matches: inputs.phashMatches,
      },
      weight: weights.visualSimilarity * 0.6, // 60% of visual similarity weight
      contributes: weights.visualSimilarity * 0.6 * visualSimilarityScore * 100,
    },
    {
      source: 'reverse_image',
      result: {
        matches: inputs.reverseImageMatches,
      },
      weight: weights.visualSimilarity * 0.4, // 40% of visual similarity weight
      contributes: weights.visualSimilarity * 0.4 * visualSimilarityScore * 100,
    },
    {
      source: 'deepfake',
      result: {
        score: inputs.deepfakeScore,
        provider: inputs.deepfakeProvider,
      },
      weight: weights.deepfakeNeg,
      contributes: weights.deepfakeNeg * deepfakeNegScore * 100,
    },
    {
      source: 'seller_identity',
      result: {
        score: inputs.sellerIdentityScore,
      },
      weight: weights.sellerIdentity,
      contributes: weights.sellerIdentity * sellerIdentityScore * 100,
    },
    {
      source: 'heuristics',
      result: {
        suspiciousAspectRatio: inputs.suspiciousAspectRatio,
        lowResolutionUpscale: inputs.lowResolutionUpscale,
        hasWatermarks: inputs.hasWatermarks,
        multipleUploadsFromIP: inputs.multipleUploadsFromIP,
      },
      weight: weights.heuristics,
      contributes: weights.heuristics * heuristicsScore * 100,
    },
  ];
  
  if (inputs.manualOverride !== undefined) {
    evidence.push({
      source: 'manual_override',
      result: {
        override: inputs.manualOverride,
      },
      weight: weights.manualOverride,
      contributes: weights.manualOverride * manualOverrideScore * 100,
    });
  }
  
  return {
    aggregatedScore,
    verdict,
    breakdown: {
      provenanceScore: Math.round(provenanceScore * 100),
      visualSimilarityScore: Math.round(visualSimilarityScore * 100),
      deepfakeNegScore: Math.round(deepfakeNegScore * 100),
      sellerIdentityScore: Math.round(sellerIdentityScore * 100),
      heuristicsScore: Math.round(heuristicsScore * 100),
      manualOverrideScore: Math.round(manualOverrideScore * 100),
    },
    evidence,
    confidence,
  };
}

/**
 * Determine if analysis should be escalated to expensive checks
 */
export function shouldEscalate(inputs: Partial<ScoringInputs>, threshold: number = 0.4): boolean {
  // Quick scoring with only cheap checks available
  let suspicionScore = 0;
  
  // High suspicion indicators
  if (inputs.phashMatches && inputs.phashMatches.length > 0) {
    const closestMatch = Math.min(...inputs.phashMatches.map(m => m.hammingDistance));
    if (closestMatch <= 8) {
      suspicionScore += 0.4;
    }
  }
  
  if (inputs.reverseImageMatches && inputs.reverseImageMatches.length > 2) {
    suspicionScore += 0.3;
  }
  
  if (!inputs.exifPresent) {
    suspicionScore += 0.2;
  }
  
  if (inputs.suspiciousAspectRatio) {
    suspicionScore += 0.2;
  }
  
  if (inputs.lowResolutionUpscale) {
    suspicionScore += 0.3;
  }
  
  if (inputs.hasWatermarks) {
    suspicionScore += 0.4;
  }
  
  return suspicionScore >= threshold;
}

/**
 * Get score explanation for user-friendly display
 */
export function getScoreExplanation(result: ScoringResult): string {
  const { aggregatedScore, verdict, breakdown } = result;
  
  let explanation = `This content received an authenticity score of ${aggregatedScore}/100, indicating it is ${verdict}. `;
  
  // Explain key factors
  const factors = [];
  
  if (breakdown.provenanceScore >= 80) {
    factors.push('strong content provenance');
  } else if (breakdown.provenanceScore <= 20) {
    factors.push('weak or missing provenance data');
  }
  
  if (breakdown.visualSimilarityScore <= 30) {
    factors.push('visual similarity to existing images');
  }
  
  if (breakdown.deepfakeNegScore <= 30) {
    factors.push('potential AI-generated content');
  }
  
  if (breakdown.sellerIdentityScore <= 40) {
    factors.push('seller identity concerns');
  }
  
  if (factors.length > 0) {
    explanation += `Key factors: ${factors.join(', ')}.`;
  }
  
  return explanation;
}
