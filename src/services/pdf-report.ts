// TrustLens - PDF Report Generation Service
// Generates comprehensive PDF reports for analysis results

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface ReportData {
  upload_id: string;
  filename: string;
  uploaded_at: Date;
  analysis_completed_at: Date;
  organisation_name: string;
  verdict: 'GENUINE' | 'SUSPICIOUS' | 'FAKE';
  aggregated_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  
  // Analysis details
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
      domain: string;
      risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    }>;
  };
  
  metadata_analysis?: {
    camera_info?: string;
    software_used?: string;
    gps_location?: string;
    timestamp_consistency: boolean;
    editing_detected: boolean;
    dimensions: { width: number; height: number };
    file_size: number;
    suspicious_indicators: string[];
  };
  
  factor_scores: {
    c2pa_score: number;
    deepfake_score: number;
    reverse_search_score: number;
    metadata_score: number;
  };
  
  risk_factors: string[];
  positive_indicators: string[];
  processing_time: number;
}

export class PDFReportService {
  private static instance: PDFReportService;
  
  // PDF styling constants
  private readonly colors = {
    primary: '#2563eb',      // Blue
    success: '#16a34a',      // Green
    warning: '#d97706',      // Orange
    danger: '#dc2626',       // Red
    text: '#374151',         // Dark gray
    muted: '#6b7280',        // Medium gray
    light: '#f3f4f6'         // Light gray
  };
  
  private readonly fonts = {
    regular: 'Helvetica',
    bold: 'Helvetica-Bold',
    italic: 'Helvetica-Oblique'
  };

  public static getInstance(): PDFReportService {
    if (!PDFReportService.instance) {
      PDFReportService.instance = new PDFReportService();
    }
    return PDFReportService.instance;
  }

  /**
   * Generate comprehensive PDF report
   */
  async generateReport(reportData: ReportData, outputPath: string): Promise<string> {
    try {
      logger.info('Generating PDF report', { 
        uploadId: reportData.upload_id,
        outputPath 
      });

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `TrustLens Analysis Report - ${reportData.filename}`,
          Author: 'TrustLens',
          Subject: 'Content Authenticity Analysis',
          Creator: 'TrustLens Platform',
          Producer: 'TrustLens PDF Service'
        }
      });

      // Create write stream
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Generate report sections
      await this.addHeader(doc, reportData);
      this.addExecutiveSummary(doc, reportData);
      this.addVerificationDetails(doc, reportData);
      this.addAnalysisBreakdown(doc, reportData);
      this.addTechnicalDetails(doc, reportData);
      this.addRecommendations(doc, reportData);
      this.addFooter(doc, reportData);

      // Finalize the PDF
      doc.end();

      // Wait for stream to finish
      await new Promise<void>((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      logger.info('PDF report generated successfully', { 
        uploadId: reportData.upload_id,
        outputPath,
        fileSize: fs.statSync(outputPath).size
      });

      return outputPath;

    } catch (error) {
      logger.error('Failed to generate PDF report', { 
        uploadId: reportData.upload_id,
        error 
      });
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add header section with logo and title
   */
  private async addHeader(doc: PDFDocument, reportData: ReportData): Promise<void> {
    // Add TrustLens logo placeholder (in production, use actual logo)
    doc.rect(50, 50, 100, 50)
       .fillAndStroke(this.colors.primary, this.colors.primary);
    
    doc.fillColor('#ffffff')
       .fontSize(16)
       .font(this.fonts.bold)
       .text('TrustLens', 70, 70, { width: 60, align: 'center' });

    // Report title
    doc.fillColor(this.colors.text)
       .fontSize(24)
       .font(this.fonts.bold)
       .text('Content Authenticity Report', 180, 60);

    // File information
    doc.fontSize(12)
       .font(this.fonts.regular)
       .fillColor(this.colors.muted)
       .text(`File: ${reportData.filename}`, 180, 90)
       .text(`Generated: ${new Date().toLocaleDateString()}`, 180, 105)
       .text(`Report ID: ${reportData.upload_id.substring(0, 8)}`, 180, 120);

    // Organization
    doc.text(`Organization: ${reportData.organisation_name}`, 400, 90);

    // Add separator line
    doc.moveTo(50, 150)
       .lineTo(545, 150)
       .strokeColor(this.colors.light)
       .stroke();

    doc.y = 170; // Set position for next section
  }

  /**
   * Add executive summary with verdict and score
   */
  private addExecutiveSummary(doc: PDFDocument, reportData: ReportData): void {
    doc.fontSize(18)
       .font(this.fonts.bold)
       .fillColor(this.colors.text)
       .text('Executive Summary', 50);

    doc.y += 20;

    // Verdict with colored background
    const verdictColor = this.getVerdictColor(reportData.verdict);
    const verdictBg = this.getVerdictBgColor(reportData.verdict);
    
    doc.rect(50, doc.y, 495, 80)
       .fillAndStroke(verdictBg, verdictColor);

    // Verdict text
    doc.fillColor('#ffffff')
       .fontSize(28)
       .font(this.fonts.bold)
       .text(reportData.verdict, 70, doc.y + 15);

    // Score
    doc.fontSize(48)
       .text(`${reportData.aggregated_score}`, 350, doc.y - 20, { width: 100, align: 'center' });

    doc.fontSize(14)
       .text('Authenticity Score', 350, doc.y + 35, { width: 100, align: 'center' });

    doc.y += 100;

    // Risk level and confidence
    doc.fillColor(this.colors.text)
       .fontSize(14)
       .font(this.fonts.regular)
       .text(`Risk Level: `, 50, doc.y);
    
    doc.font(this.fonts.bold)
       .fillColor(this.getRiskColor(reportData.risk_level))
       .text(reportData.risk_level, 120, doc.y);

    doc.fillColor(this.colors.text)
       .font(this.fonts.regular)
       .text(`Confidence: ${reportData.confidence}%`, 250, doc.y);

    doc.y += 30;

    // Brief summary
    const summary = this.generateSummaryText(reportData);
    doc.fontSize(12)
       .fillColor(this.colors.text)
       .text(summary, 50, doc.y, { width: 495, align: 'justify' });

    doc.y += 40;
  }

  /**
   * Add detailed verification results
   */
  private addVerificationDetails(doc: PDFDocument, reportData: ReportData): void {
    doc.fontSize(18)
       .font(this.fonts.bold)
       .fillColor(this.colors.text)
       .text('Verification Details', 50);

    doc.y += 20;

    // C2PA Verification
    if (reportData.c2pa_verification) {
      this.addSubsection(doc, 'C2PA Digital Signature', reportData.factor_scores.c2pa_score);
      
      const c2pa = reportData.c2pa_verification;
      doc.fontSize(12)
         .font(this.fonts.regular)
         .fillColor(this.colors.text);
      
      doc.text(`✓ Manifest Present: ${c2pa.manifest_present ? 'Yes' : 'No'}`, 70, doc.y);
      doc.text(`✓ Signature Valid: ${c2pa.signature_valid ? 'Yes' : 'No'}`, 270, doc.y);
      doc.y += 15;
      
      if (c2pa.issuer) {
        doc.text(`✓ Issuer: ${c2pa.issuer}`, 70, doc.y);
        doc.y += 15;
      }
      
      doc.y += 10;
    }

    // Deepfake Detection
    if (reportData.deepfake_detection) {
      this.addSubsection(doc, 'AI Manipulation Detection', reportData.factor_scores.deepfake_score);
      
      const deepfake = reportData.deepfake_detection;
      doc.fontSize(12)
         .font(this.fonts.regular)
         .fillColor(this.colors.text);
      
      doc.text(`✓ Manipulation Score: ${deepfake.score}%`, 70, doc.y);
      doc.text(`✓ Detection Confidence: ${deepfake.confidence}%`, 270, doc.y);
      doc.y += 15;
      
      doc.text(`✓ Faces Detected: ${deepfake.detected_faces}`, 70, doc.y);
      doc.text(`✓ Technology: ${deepfake.technology_used}`, 270, doc.y);
      doc.y += 25;
    }

    // Reverse Image Search
    if (reportData.reverse_image_search) {
      this.addSubsection(doc, 'Content Originality Check', reportData.factor_scores.reverse_search_score);
      
      const reverse = reportData.reverse_image_search;
      doc.fontSize(12)
         .font(this.fonts.regular)
         .fillColor(this.colors.text);
      
      doc.text(`✓ Total Matches: ${reverse.matches_found}`, 70, doc.y);
      doc.text(`✓ Suspicious Sources: ${reverse.suspicious_sources}`, 270, doc.y);
      doc.y += 15;
      
      if (reverse.earliest_occurrence) {
        doc.text(`✓ Earliest Found: ${reverse.earliest_occurrence.toLocaleDateString()}`, 70, doc.y);
        doc.y += 15;
      }
      
      doc.y += 10;
    }

    // Metadata Analysis
    if (reportData.metadata_analysis) {
      this.addSubsection(doc, 'Technical Metadata', reportData.factor_scores.metadata_score);
      
      const metadata = reportData.metadata_analysis;
      doc.fontSize(12)
         .font(this.fonts.regular)
         .fillColor(this.colors.text);
      
      if (metadata.camera_info) {
        doc.text(`✓ Camera: ${metadata.camera_info}`, 70, doc.y);
        doc.y += 15;
      }
      
      if (metadata.software_used) {
        doc.text(`✓ Software: ${metadata.software_used}`, 70, doc.y);
        doc.y += 15;
      }
      
      doc.text(`✓ Dimensions: ${metadata.dimensions.width}x${metadata.dimensions.height}`, 70, doc.y);
      doc.text(`✓ File Size: ${this.formatFileSize(metadata.file_size)}`, 270, doc.y);
      doc.y += 15;
      
      doc.text(`✓ Timestamp Consistency: ${metadata.timestamp_consistency ? 'Good' : 'Issues'}`, 70, doc.y);
      doc.text(`✓ Editing Detected: ${metadata.editing_detected ? 'Yes' : 'No'}`, 270, doc.y);
      doc.y += 25;
    }
  }

  /**
   * Add analysis breakdown with charts
   */
  private addAnalysisBreakdown(doc: PDFDocument, reportData: ReportData): void {
    // Check if we need a new page
    if (doc.y > 600) {
      doc.addPage();
    }

    doc.fontSize(18)
       .font(this.fonts.bold)
       .fillColor(this.colors.text)
       .text('Analysis Breakdown', 50);

    doc.y += 20;

    // Factor scores bar chart
    this.drawBarChart(doc, reportData.factor_scores);

    doc.y += 40;

    // Risk factors
    if (reportData.risk_factors.length > 0) {
      doc.fontSize(14)
         .font(this.fonts.bold)
         .fillColor(this.colors.danger)
         .text('⚠ Risk Factors Identified:', 50);

      doc.y += 15;

      reportData.risk_factors.forEach((risk, index) => {
        doc.fontSize(11)
           .font(this.fonts.regular)
           .fillColor(this.colors.text)
           .text(`${index + 1}. ${risk}`, 70, doc.y, { width: 475 });
        doc.y += 15;
      });

      doc.y += 10;
    }

    // Positive indicators
    if (reportData.positive_indicators.length > 0) {
      doc.fontSize(14)
         .font(this.fonts.bold)
         .fillColor(this.colors.success)
         .text('✓ Positive Indicators:', 50);

      doc.y += 15;

      reportData.positive_indicators.forEach((indicator, index) => {
        doc.fontSize(11)
           .font(this.fonts.regular)
           .fillColor(this.colors.text)
           .text(`${index + 1}. ${indicator}`, 70, doc.y, { width: 475 });
        doc.y += 15;
      });
    }
  }

  /**
   * Add technical details section
   */
  private addTechnicalDetails(doc: PDFDocument, reportData: ReportData): void {
    // Check if we need a new page
    if (doc.y > 650) {
      doc.addPage();
    }

    doc.fontSize(18)
       .font(this.fonts.bold)
       .fillColor(this.colors.text)
       .text('Technical Details', 50);

    doc.y += 20;

    // Processing information
    doc.fontSize(12)
       .font(this.fonts.regular)
       .fillColor(this.colors.text)
       .text(`Analysis completed: ${reportData.analysis_completed_at.toLocaleString()}`, 50, doc.y)
       .text(`Processing time: ${reportData.processing_time}ms`, 300, doc.y);

    doc.y += 25;

    // Reverse search details
    if (reportData.reverse_image_search && reportData.reverse_image_search.sources.length > 0) {
      doc.fontSize(14)
         .font(this.fonts.bold)
         .text('Sources Found:', 50);

      doc.y += 15;

      // Table header
      doc.fontSize(10)
         .font(this.fonts.bold)
         .text('Domain', 50, doc.y)
         .text('Similarity', 200, doc.y)
         .text('Risk Level', 300, doc.y)
         .text('URL', 400, doc.y);

      doc.y += 15;

      // Table rows
      reportData.reverse_image_search.sources.slice(0, 10).forEach(source => {
        doc.fontSize(9)
           .font(this.fonts.regular)
           .text(source.domain, 50, doc.y)
           .text(`${source.similarity}%`, 200, doc.y)
           .fillColor(this.getRiskColor(source.risk_level))
           .text(source.risk_level, 300, doc.y)
           .fillColor(this.colors.text)
           .text(source.url.length > 30 ? source.url.substring(0, 30) + '...' : source.url, 400, doc.y);
        doc.y += 12;
      });
    }
  }

  /**
   * Add recommendations section
   */
  private addRecommendations(doc: PDFDocument, reportData: ReportData): void {
    // Check if we need a new page
    if (doc.y > 650) {
      doc.addPage();
    }

    doc.fontSize(18)
       .font(this.fonts.bold)
       .fillColor(this.colors.text)
       .text('Recommendations', 50);

    doc.y += 20;

    const recommendations = this.generateRecommendations(reportData);
    
    recommendations.forEach((recommendation, index) => {
      doc.fontSize(12)
         .font(this.fonts.regular)
         .fillColor(this.colors.text)
         .text(`${index + 1}. ${recommendation}`, 50, doc.y, { width: 495 });
      doc.y += 20;
    });
  }

  /**
   * Add footer with disclaimer
   */
  private addFooter(doc: PDFDocument, reportData: ReportData): void {
    // Add new page for footer if needed
    if (doc.y > 700) {
      doc.addPage();
    }

    // Disclaimer
    doc.fontSize(10)
       .font(this.fonts.italic)
       .fillColor(this.colors.muted)
       .text(
         'This report is generated by TrustLens automated analysis system. While our AI-powered tools provide ' +
         'comprehensive content verification, this report should be considered as part of a broader verification ' +
         'process. TrustLens makes no warranties about the absolute authenticity of content and recommends ' +
         'additional verification for critical applications.',
         50, 
         750, 
         { width: 495, align: 'justify' }
       );

    // Page numbers (for multi-page documents)
    const pageCount = (doc as any).bufferedPageRange().count;
    if (pageCount > 1) {
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(9)
           .fillColor(this.colors.muted)
           .text(`Page ${i + 1} of ${pageCount}`, 495, 770, { width: 50, align: 'right' });
      }
    }
  }

  /**
   * Add subsection header with score
   */
  private addSubsection(doc: PDFDocument, title: string, score: number): void {
    doc.fontSize(14)
       .font(this.fonts.bold)
       .fillColor(this.colors.text)
       .text(title, 50, doc.y);

    // Score badge
    const scoreColor = score >= 70 ? this.colors.success : score >= 40 ? this.colors.warning : this.colors.danger;
    doc.rect(400, doc.y - 2, 60, 18)
       .fillAndStroke(scoreColor, scoreColor);

    doc.fillColor('#ffffff')
       .fontSize(12)
       .text(`${Math.round(score)}%`, 410, doc.y, { width: 40, align: 'center' });

    doc.y += 25;
  }

  /**
   * Draw bar chart for factor scores
   */
  private drawBarChart(doc: PDFDocument, scores: ReportData['factor_scores']): void {
    const chartY = doc.y;
    const chartHeight = 120;
    const barWidth = 80;
    const barSpacing = 100;

    const factors = [
      { name: 'C2PA', score: scores.c2pa_score },
      { name: 'Deepfake', score: scores.deepfake_score },
      { name: 'Reverse Search', score: scores.reverse_search_score },
      { name: 'Metadata', score: scores.metadata_score }
    ];

    factors.forEach((factor, index) => {
      const x = 70 + index * barSpacing;
      const barHeight = (factor.score / 100) * chartHeight;
      const barY = chartY + chartHeight - barHeight;

      // Bar
      const barColor = factor.score >= 70 ? this.colors.success : 
                      factor.score >= 40 ? this.colors.warning : this.colors.danger;
      
      doc.rect(x, barY, barWidth, barHeight)
         .fillAndStroke(barColor, barColor);

      // Score label
      doc.fillColor('#ffffff')
         .fontSize(12)
         .font(this.fonts.bold)
         .text(`${Math.round(factor.score)}`, x + 10, barY + barHeight/2 - 6, { width: 60, align: 'center' });

      // Factor name
      doc.fillColor(this.colors.text)
         .fontSize(10)
         .font(this.fonts.regular)
         .text(factor.name, x, chartY + chartHeight + 10, { width: barWidth, align: 'center' });
    });

    doc.y = chartY + chartHeight + 30;
  }

  /**
   * Get color for verdict
   */
  private getVerdictColor(verdict: string): string {
    switch (verdict) {
      case 'GENUINE': return this.colors.success;
      case 'SUSPICIOUS': return this.colors.warning;
      case 'FAKE': return this.colors.danger;
      default: return this.colors.muted;
    }
  }

  /**
   * Get background color for verdict
   */
  private getVerdictBgColor(verdict: string): string {
    switch (verdict) {
      case 'GENUINE': return '#dcfce7';
      case 'SUSPICIOUS': return '#fef3c7';
      case 'FAKE': return '#fecaca';
      default: return this.colors.light;
    }
  }

  /**
   * Get color for risk level
   */
  private getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'LOW': return this.colors.success;
      case 'MEDIUM': return this.colors.warning;
      case 'HIGH': return this.colors.danger;
      case 'CRITICAL': return '#991b1b';
      default: return this.colors.muted;
    }
  }

  /**
   * Generate summary text
   */
  private generateSummaryText(reportData: ReportData): string {
    const { verdict, aggregated_score, risk_level } = reportData;
    
    if (verdict === 'GENUINE') {
      return `Our analysis indicates this content is authentic with high confidence. The content scored ${aggregated_score}% ` +
             `on our authenticity scale and shows ${reportData.positive_indicators.length} positive verification indicators. ` +
             `This content is considered ${risk_level.toLowerCase()} risk for fraudulent use.`;
    } else if (verdict === 'SUSPICIOUS') {
      return `This content shows concerning patterns that warrant careful review. With a score of ${aggregated_score}%, ` +
             `our analysis identified ${reportData.risk_factors.length} potential risk factors. ` +
             `We recommend additional verification before using this content.`;
    } else {
      return `Our analysis strongly suggests this content has been manipulated or fabricated. The content scored ` +
             `${aggregated_score}% and triggered ${reportData.risk_factors.length} risk indicators. ` +
             `We strongly recommend against using this content without thorough verification.`;
    }
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(reportData: ReportData): string[] {
    const recommendations: string[] = [];
    
    if (reportData.verdict === 'GENUINE' && reportData.risk_level === 'LOW') {
      recommendations.push('Content appears authentic and suitable for use with standard verification protocols.');
      recommendations.push('Continue monitoring for any additional context or sources that may emerge.');
    } else if (reportData.verdict === 'SUSPICIOUS') {
      recommendations.push('Conduct additional verification through alternative sources and methods.');
      recommendations.push('Consider requesting original source files or documentation from the content provider.');
      recommendations.push('Implement watermarking or tracking if using this content publicly.');
    } else {
      recommendations.push('Do not use this content without extensive additional verification.');
      recommendations.push('Consider this content potentially fraudulent and investigate the source.');
      recommendations.push('Report suspicious content to relevant authorities if appropriate.');
    }

    // Add specific technical recommendations
    if (reportData.deepfake_detection?.score && reportData.deepfake_detection.score > 60) {
      recommendations.push('High deepfake probability detected - consider facial analysis by human experts.');
    }

    if (reportData.reverse_image_search?.suspicious_sources && reportData.reverse_image_search.suspicious_sources > 0) {
      recommendations.push('Content found on suspicious websites - verify original source and ownership.');
    }

    if (reportData.metadata_analysis?.editing_detected) {
      recommendations.push('Image editing detected - request unedited original files if possible.');
    }

    return recommendations;
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  }
}
