// TrustLens - Reverse Image Search Service
// Searches for image/video duplicates across the web to detect stolen or reused content

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

export interface ReverseSearchResult {
  matches_found: number;
  suspicious_sources: number;
  earliest_occurrence?: Date;
  sources: Array<{
    url: string;
    similarity: number;
    domain: string;
    title?: string;
    date_found?: Date;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    context?: string;
  }>;
  processing_time: number;
  search_engines_used: string[];
}

export interface TinEyeResponse {
  status: string;
  results: Array<{
    image_url: string;
    website_url: string;
    similarity: number;
    size: string;
    crawl_date: string;
    domain: string;
    title?: string;
  }>;
  total_results: number;
}

export interface GoogleVisionResponse {
  webDetection: {
    webEntities: Array<{
      entityId: string;
      score: number;
      description: string;
    }>;
    fullMatchingImages: Array<{
      url: string;
      score: number;
    }>;
    partialMatchingImages: Array<{
      url: string;
      score: number;
    }>;
    pagesWithMatchingImages: Array<{
      url: string;
      pageTitle: string;
      fullMatchingImages: Array<{ url: string }>;
    }>;
  };
}

export class ReverseSearchService {
  private static instance: ReverseSearchService;
  private tineyeApiKey: string;
  private googleVisionApiKey: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  // Known suspicious domains for content theft
  private suspiciousDomains = [
    'alibaba.com',
    'aliexpress.com',
    'dhgate.com',
    'wish.com',
    'temu.com',
    'shein.com',
    'romwe.com',
    'zaful.com',
    'rosegal.com',
    'sammydress.com',
    'lightinthebox.com',
    'gearbest.com',
    'banggood.com'
  ];

  // High-risk file sharing sites
  private riskySites = [
    'imgur.com',
    'photobucket.com',
    'imageshack.com',
    'tinypic.com',
    'flickr.com/photos/unknown',
    'reddit.com/r/',
    '4chan.org',
    'tumblr.com'
  ];

  constructor() {
    this.tineyeApiKey = config.TINEYE_API_KEY || '';
    this.googleVisionApiKey = config.GOOGLE_VISION_API_KEY || '';
    
    if (!this.tineyeApiKey && !this.googleVisionApiKey) {
      logger.warn('No reverse image search API keys configured');
    }
  }

  public static getInstance(): ReverseSearchService {
    if (!ReverseSearchService.instance) {
      ReverseSearchService.instance = new ReverseSearchService();
    }
    return ReverseSearchService.instance;
  }

  /**
   * Perform comprehensive reverse image search
   */
  async searchForDuplicates(
    filePath: string,
    mimeType: string,
    uploadId: string
  ): Promise<ReverseSearchResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting reverse image search', { uploadId, mimeType });

      // Only support images for reverse search
      if (!mimeType.startsWith('image/')) {
        return this.createEmptyResult(startTime, 'Video reverse search not supported');
      }

      // Run multiple search engines in parallel
      const searchPromises: Promise<Partial<ReverseSearchResult>>[] = [];

      // TinEye search
      if (this.tineyeApiKey) {
        searchPromises.push(this.searchWithTinEye(filePath, uploadId));
      }

      // Google Vision API search
      if (this.googleVisionApiKey) {
        searchPromises.push(this.searchWithGoogleVision(filePath, uploadId));
      }

      // Local perceptual hash search (fallback)
      searchPromises.push(this.performLocalSearch(filePath, uploadId));

      // Wait for all searches to complete
      const results = await Promise.allSettled(searchPromises);
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<Partial<ReverseSearchResult>> => 
          result.status === 'fulfilled')
        .map(result => result.value);

      if (successfulResults.length === 0) {
        return this.createEmptyResult(startTime, 'All reverse search methods failed');
      }

      // Aggregate results from all sources
      const aggregatedResult = this.aggregateSearchResults(successfulResults);
      aggregatedResult.processing_time = Date.now() - startTime;

      // Analyze and score the findings
      this.analyzeSearchResults(aggregatedResult);

      logger.info('Reverse image search completed', {
        uploadId,
        matches: aggregatedResult.matches_found,
        suspicious: aggregatedResult.suspicious_sources,
        engines: aggregatedResult.search_engines_used,
        processingTime: aggregatedResult.processing_time
      });

      return aggregatedResult;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Reverse image search failed', { uploadId, error, processingTime });
      
      return this.createEmptyResult(processingTime, `Search failed: ${error.message}`);
    }
  }

  /**
   * Search using TinEye API
   */
  private async searchWithTinEye(
    filePath: string,
    uploadId: string
  ): Promise<Partial<ReverseSearchResult>> {
    try {
      logger.info('Searching with TinEye', { uploadId });

      const formData = new FormData();
      formData.append('image', fs.createReadStream(filePath));

      const response = await this.makeApiRequestWithRetry(
        'https://api.tineye.com/rest/search/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.tineyeApiKey}`,
            ...formData.getHeaders()
          },
          data: formData,
          timeout: 30000
        }
      );

      const tineyeResult: TinEyeResponse = response.data;

      if (tineyeResult.status !== 'ok') {
        throw new Error(`TinEye API error: ${tineyeResult.status}`);
      }

      // Convert TinEye results to our format
      const sources = tineyeResult.results.map(result => ({
        url: result.website_url,
        similarity: result.similarity,
        domain: result.domain,
        title: result.title,
        date_found: new Date(result.crawl_date),
        risk_level: this.assessDomainRisk(result.domain),
        context: `Found on ${result.domain} - Image size: ${result.size}`
      }));

      return {
        matches_found: tineyeResult.total_results,
        sources: sources,
        search_engines_used: ['TinEye']
      };

    } catch (error) {
      logger.error('TinEye search failed', { uploadId, error });
      throw error;
    }
  }

  /**
   * Search using Google Vision API
   */
  private async searchWithGoogleVision(
    filePath: string,
    uploadId: string
  ): Promise<Partial<ReverseSearchResult>> {
    try {
      logger.info('Searching with Google Vision API', { uploadId });

      // Read and encode image
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');

      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'WEB_DETECTION',
                maxResults: 50
              }
            ]
          }
        ]
      };

      const response = await this.makeApiRequestWithRetry(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.googleVisionApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          data: requestBody,
          timeout: 30000
        }
      );

      const visionResult = response.data.responses[0];
      if (!visionResult.webDetection) {
        return {
          matches_found: 0,
          sources: [],
          search_engines_used: ['Google Vision']
        };
      }

      const webDetection: GoogleVisionResponse['webDetection'] = visionResult.webDetection;
      const sources: ReverseSearchResult['sources'] = [];

      // Process full matching images
      if (webDetection.fullMatchingImages) {
        webDetection.fullMatchingImages.forEach(match => {
          try {
            const url = new URL(match.url);
            sources.push({
              url: match.url,
              similarity: 100, // Full match
              domain: url.hostname,
              risk_level: this.assessDomainRisk(url.hostname),
              context: 'Exact image match found'
            });
          } catch (error) {
            // Invalid URL, skip
          }
        });
      }

      // Process partial matching images
      if (webDetection.partialMatchingImages) {
        webDetection.partialMatchingImages.forEach(match => {
          try {
            const url = new URL(match.url);
            sources.push({
              url: match.url,
              similarity: 75, // Estimated similarity for partial match
              domain: url.hostname,
              risk_level: this.assessDomainRisk(url.hostname),
              context: 'Partial image match found'
            });
          } catch (error) {
            // Invalid URL, skip
          }
        });
      }

      // Process pages with matching images
      if (webDetection.pagesWithMatchingImages) {
        webDetection.pagesWithMatchingImages.forEach(page => {
          try {
            const url = new URL(page.url);
            sources.push({
              url: page.url,
              similarity: 90, // High similarity for page matches
              domain: url.hostname,
              title: page.pageTitle,
              risk_level: this.assessDomainRisk(url.hostname),
              context: `Found on page: ${page.pageTitle || 'Unknown title'}`
            });
          } catch (error) {
            // Invalid URL, skip
          }
        });
      }

      return {
        matches_found: sources.length,
        sources: sources,
        search_engines_used: ['Google Vision']
      };

    } catch (error) {
      logger.error('Google Vision search failed', { uploadId, error });
      throw error;
    }
  }

  /**
   * Perform local perceptual hash search (placeholder)
   */
  private async performLocalSearch(
    filePath: string,
    uploadId: string
  ): Promise<Partial<ReverseSearchResult>> {
    try {
      logger.info('Performing local hash search', { uploadId });

      // Generate perceptual hash of the image
      const imageHash = this.generatePerceptualHash(filePath);
      
      // In production, you would:
      // 1. Store hashes of previously seen images in database
      // 2. Use similarity algorithms to find near-matches
      // 3. Maintain a database of known suspicious image hashes
      
      // For now, return minimal results
      const sources: ReverseSearchResult['sources'] = [];
      
      // Check against known hash patterns (placeholder)
      const knownSuspiciousHashes = [
        'a1b2c3d4e5f6g7h8', // Example suspicious hash
        'x9y8z7w6v5u4t3s2'  // Another example
      ];
      
      if (knownSuspiciousHashes.includes(imageHash.substring(0, 16))) {
        sources.push({
          url: 'internal://suspicious-content-database',
          similarity: 95,
          domain: 'internal.trustlens.com',
          risk_level: 'HIGH',
          context: 'Image matches known suspicious content in database'
        });
      }

      return {
        matches_found: sources.length,
        sources: sources,
        search_engines_used: ['TrustLens Local']
      };

    } catch (error) {
      logger.error('Local search failed', { uploadId, error });
      throw error;
    }
  }

  /**
   * Generate a simple perceptual hash for the image
   */
  private generatePerceptualHash(filePath: string): string {
    try {
      // This is a simplified hash based on file content
      // In production, use proper perceptual hashing like:
      // - pHash (perceptual hash)
      // - dHash (difference hash)
      // - aHash (average hash)
      
      const buffer = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(buffer).digest('hex');
    } catch (error) {
      logger.error('Failed to generate perceptual hash', { filePath, error });
      return 'unknown';
    }
  }

  /**
   * Assess the risk level of a domain
   */
  private assessDomainRisk(domain: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const lowerDomain = domain.toLowerCase();

    // Check against known suspicious domains
    if (this.suspiciousDomains.some(suspicious => lowerDomain.includes(suspicious))) {
      return 'CRITICAL';
    }

    // Check against risky file sharing sites
    if (this.riskySites.some(risky => lowerDomain.includes(risky))) {
      return 'HIGH';
    }

    // Check for suspicious patterns
    if (lowerDomain.includes('fake') || 
        lowerDomain.includes('replica') || 
        lowerDomain.includes('counterfeit') ||
        lowerDomain.includes('copy')) {
      return 'HIGH';
    }

    // Check for known legitimate domains
    const legitimateDomains = [
      'amazon.com', 'ebay.com', 'shopify.com', 'etsy.com',
      'walmart.com', 'target.com', 'bestbuy.com', 'costco.com',
      'macys.com', 'nordstrom.com', 'zappos.com'
    ];

    if (legitimateDomains.some(legitimate => lowerDomain.includes(legitimate))) {
      return 'LOW';
    }

    // Default to medium risk for unknown domains
    return 'MEDIUM';
  }

  /**
   * Aggregate results from multiple search engines
   */
  private aggregateSearchResults(
    results: Partial<ReverseSearchResult>[]
  ): ReverseSearchResult {
    const aggregated: ReverseSearchResult = {
      matches_found: 0,
      suspicious_sources: 0,
      sources: [],
      processing_time: 0,
      search_engines_used: []
    };

    const urlsSeen = new Set<string>();
    let earliestDate: Date | undefined;

    results.forEach(result => {
      if (result.matches_found) {
        aggregated.matches_found += result.matches_found;
      }

      if (result.search_engines_used) {
        aggregated.search_engines_used.push(...result.search_engines_used);
      }

      if (result.sources) {
        result.sources.forEach(source => {
          // Avoid duplicate URLs
          if (!urlsSeen.has(source.url)) {
            urlsSeen.add(source.url);
            aggregated.sources.push(source);

            // Track earliest occurrence
            if (source.date_found) {
              if (!earliestDate || source.date_found < earliestDate) {
                earliestDate = source.date_found;
              }
            }
          }
        });
      }
    });

    // Remove duplicates from search engines
    aggregated.search_engines_used = [...new Set(aggregated.search_engines_used)];
    
    // Set earliest occurrence
    if (earliestDate) {
      aggregated.earliest_occurrence = earliestDate;
    }

    return aggregated;
  }

  /**
   * Analyze search results and update suspicious sources count
   */
  private analyzeSearchResults(result: ReverseSearchResult): void {
    result.suspicious_sources = result.sources.filter(source => 
      source.risk_level === 'HIGH' || source.risk_level === 'CRITICAL'
    ).length;

    // Sort sources by risk level and similarity
    result.sources.sort((a, b) => {
      const riskOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const aRisk = riskOrder[a.risk_level];
      const bRisk = riskOrder[b.risk_level];
      
      if (aRisk !== bRisk) {
        return bRisk - aRisk; // Higher risk first
      }
      
      return b.similarity - a.similarity; // Higher similarity first
    });

    // Limit to top 20 results for performance
    if (result.sources.length > 20) {
      result.sources = result.sources.slice(0, 20);
    }
  }

  /**
   * Create empty result object
   */
  private createEmptyResult(processingTime: number, reason: string): ReverseSearchResult {
    return {
      matches_found: 0,
      suspicious_sources: 0,
      sources: [],
      processing_time: processingTime,
      search_engines_used: [],
      earliest_occurrence: undefined
    };
  }

  /**
   * Make API request with retry logic
   */
  private async makeApiRequestWithRetry(url: string, config: any): Promise<any> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await axios(url, config);
      } catch (error) {
        lastError = error;
        logger.warn(`API request attempt ${attempt} failed`, { url, error });

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * Utility function to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service status
   */
  async getServiceStatus(): Promise<{
    tineye_available: boolean;
    google_vision_available: boolean;
    local_search_available: boolean;
  }> {
    const status = {
      tineye_available: false,
      google_vision_available: false,
      local_search_available: true
    };

    // Test TinEye API
    if (this.tineyeApiKey) {
      try {
        await axios.get('https://api.tineye.com/rest/quota/', {
          headers: { 'Authorization': `Bearer ${this.tineyeApiKey}` },
          timeout: 5000
        });
        status.tineye_available = true;
      } catch (error) {
        logger.warn('TinEye API not available', { error });
      }
    }

    // Test Google Vision API
    if (this.googleVisionApiKey) {
      try {
        await axios.get(`https://vision.googleapis.com/v1/operations?key=${this.googleVisionApiKey}`, {
          timeout: 5000
        });
        status.google_vision_available = true;
      } catch (error) {
        logger.warn('Google Vision API not available', { error });
      }
    }

    return status;
  }
}
