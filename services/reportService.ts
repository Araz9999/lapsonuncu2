import { logger } from '@/utils/logger';
import { emailService } from '@/backend/services/email';

export interface StoreReport {
  storeId: string;
  storeName: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    views: number;
    viewsChange: number;
    favorites: number;
    favoritesChange: number;
    messages: number;
    messagesChange: number;
    followers: number;
    followersChange: number;
    sales: number;
    salesChange: number;
    revenue: number;
    revenueChange: number;
    avgRating: number;
    ratingChange: number;
    activeListings: number;
    totalListings: number;
  };
  topListings: Array<{
    id: string;
    title: string;
    views: number;
    sales: number;
    revenue: number;
  }>;
  demographics: {
    ageGroups: Array<{ range: string; percentage: number }>;
    cities: Array<{ name: string; percentage: number }>;
  };
}

export interface ReportOptions {
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  format: 'email' | 'pdf' | 'excel' | 'json';
  anonymous: boolean;
}

class ReportService {
  /**
   * Generate a weekly store analytics report
   */
  async generateWeeklyReport(storeId: string, userEmail: string, userName: string): Promise<boolean> {
    try {
      // ✅ Validate inputs
      if (!storeId || typeof storeId !== 'string' || storeId.trim().length === 0) {
        logger.error('[ReportService] Invalid storeId');
        throw new Error('Invalid store ID');
      }

      if (!userEmail || typeof userEmail !== 'string' || !this.isValidEmail(userEmail)) {
        logger.error('[ReportService] Invalid email');
        throw new Error('Invalid email address');
      }

      if (!userName || typeof userName !== 'string' || userName.trim().length === 0) {
        logger.error('[ReportService] Invalid userName');
        throw new Error('Invalid user name');
      }

      logger.info(`[ReportService] Generating weekly report for store: ${storeId}`);

      // In a real app, this would fetch actual analytics data
      // For now, we'll use mock data
      const report = await this.fetchStoreReport(storeId, 'weekly');

      // ✅ Send email report
      const emailSent = await this.sendWeeklyReportEmail(userEmail, userName, report);

      if (!emailSent) {
        logger.error('[ReportService] Failed to send weekly report email');
        return false;
      }

      logger.info(`[ReportService] Weekly report sent successfully to: ${userEmail}`);
      return true;
    } catch (error) {
      logger.error('[ReportService] Error generating weekly report:', error);
      throw error;
    }
  }

  /**
   * Fetch store analytics report data
   */
  private async fetchStoreReport(storeId: string, period: 'weekly' | 'monthly'): Promise<StoreReport> {
    // ✅ This would typically query the database
    // For now, return mock data

    const now = new Date();
    const daysAgo = period === 'weekly' ? 7 : 30;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return {
      storeId,
      storeName: 'Mock Store', // Would fetch from DB
      period: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      metrics: {
        views: 12450,
        viewsChange: 15.2,
        favorites: 234,
        favoritesChange: 8.7,
        messages: 89,
        messagesChange: -3.2,
        followers: 156,
        followersChange: 12.5,
        sales: 45,
        salesChange: 22.1,
        revenue: 2340,
        revenueChange: 18.9,
        avgRating: 4.7,
        ratingChange: 0.3,
        activeListings: 23,
        totalListings: 45,
      },
      topListings: [
        { id: '1', title: 'Top Product 1', views: 1250, sales: 15, revenue: 750 },
        { id: '2', title: 'Top Product 2', views: 980, sales: 12, revenue: 600 },
        { id: '3', title: 'Top Product 3', views: 850, sales: 10, revenue: 500 },
      ],
      demographics: {
        ageGroups: [
          { range: '18-25', percentage: 30 },
          { range: '26-35', percentage: 40 },
          { range: '36-45', percentage: 20 },
          { range: '45+', percentage: 10 },
        ],
        cities: [
          { name: 'Bakı', percentage: 65 },
          { name: 'Gəncə', percentage: 15 },
          { name: 'Sumqayıt', percentage: 12 },
          { name: 'Digər', percentage: 8 },
        ],
      },
    };
  }

  /**
   * Send weekly report email
   */
  private async sendWeeklyReportEmail(
    email: string,
    name: string,
    report: StoreReport
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Həftəlik Analitika Hesabatı</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            background: #ffffff;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #007AFF;
          }
          .header h1 {
            color: #007AFF;
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .header p {
            color: #666;
            margin: 0;
            font-size: 14px;
          }
          .period {
            background: #F2F2F7;
            padding: 12px 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
            font-weight: 600;
            color: #333;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 30px;
          }
          .metric-card {
            background: #F9F9F9;
            padding: 16px;
            border-radius: 8px;
            border-left: 4px solid #007AFF;
          }
          .metric-label {
            font-size: 13px;
            color: #666;
            margin-bottom: 4px;
          }
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 4px;
          }
          .metric-change {
            font-size: 12px;
            font-weight: 600;
          }
          .metric-change.positive {
            color: #34C759;
          }
          .metric-change.negative {
            color: #FF3B30;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #E5E5E5;
          }
          .top-listing {
            background: #F9F9F9;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .listing-title {
            font-weight: 500;
            color: #333;
          }
          .listing-stats {
            font-size: 13px;
            color: #666;
          }
          .demographic-bar {
            height: 24px;
            background: #F2F2F7;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 12px;
            display: flex;
          }
          .demographic-segment {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            color: white;
            font-weight: 600;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: #007AFF;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #E5E5E5;
            font-size: 13px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Həftəlik Analitika Hesabatı</h1>
            <p>Mağazanız: ${report.storeName}</p>
          </div>
          
          <div class="period">
            ${new Date(report.period.start).toLocaleDateString('az-AZ')} - 
            ${new Date(report.period.end).toLocaleDateString('az-AZ')}
          </div>
          
          <div class="section">
            <div class="section-title">Əsas Göstəricilər</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Baxışlar</div>
                <div class="metric-value">${report.metrics.views.toLocaleString()}</div>
                <div class="metric-change ${report.metrics.viewsChange >= 0 ? 'positive' : 'negative'}">
                  ${report.metrics.viewsChange >= 0 ? '↑' : '↓'} ${Math.abs(report.metrics.viewsChange).toFixed(1)}%
                </div>
              </div>
              
              <div class="metric-card">
                <div class="metric-label">Sevimlilər</div>
                <div class="metric-value">${report.metrics.favorites.toLocaleString()}</div>
                <div class="metric-change ${report.metrics.favoritesChange >= 0 ? 'positive' : 'negative'}">
                  ${report.metrics.favoritesChange >= 0 ? '↑' : '↓'} ${Math.abs(report.metrics.favoritesChange).toFixed(1)}%
                </div>
              </div>
              
              <div class="metric-card">
                <div class="metric-label">Satışlar</div>
                <div class="metric-value">${report.metrics.sales.toLocaleString()}</div>
                <div class="metric-change ${report.metrics.salesChange >= 0 ? 'positive' : 'negative'}">
                  ${report.metrics.salesChange >= 0 ? '↑' : '↓'} ${Math.abs(report.metrics.salesChange).toFixed(1)}%
                </div>
              </div>
              
              <div class="metric-card">
                <div class="metric-label">Gəlir</div>
                <div class="metric-value">${report.metrics.revenue.toLocaleString()} AZN</div>
                <div class="metric-change ${report.metrics.revenueChange >= 0 ? 'positive' : 'negative'}">
                  ${report.metrics.revenueChange >= 0 ? '↑' : '↓'} ${Math.abs(report.metrics.revenueChange).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Ən Populyar Elanlar</div>
            ${report.topListings
              .map(
                listing => `
                <div class="top-listing">
                  <span class="listing-title">${listing.title}</span>
                  <span class="listing-stats">${listing.views} baxış • ${listing.sales} satış</span>
                </div>
              `
              )
              .join('')}
          </div>
          
          <div class="section">
            <div class="section-title">Ziyarətçi Demografikası</div>
            <div style="margin-bottom: 20px;">
              <strong style="display: block; margin-bottom: 8px;">Yaş Qrupları:</strong>
              <div class="demographic-bar">
                ${report.demographics.ageGroups
                  .map(
                    (group, index) => `
                    <div class="demographic-segment" style="flex: ${group.percentage}; background: ${
                      ['#007AFF', '#34C759', '#FF9500', '#FF3B30'][index]
                    }">
                      ${group.range}<br>${group.percentage}%
                    </div>
                  `
                  )
                  .join('')}
              </div>
            </div>
            
            <div>
              <strong style="display: block; margin-bottom: 8px;">Şəhərlər:</strong>
              ${report.demographics.cities
                .map(
                  city => `
                <div style="margin-bottom: 4px; font-size: 14px;">
                  <span>${city.name}:</span> <strong>${city.percentage}%</strong>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${emailService['baseUrl']}/store-analytics/${report.storeId}" class="button">
              Tam Hesabata Bax
            </a>
          </div>
          
          <div class="footer">
            <p>Bu hesabat avtomatik olaraq hər həftə göndərilir.</p>
            <p>Hörmətlə, NaxtaPaz Komandası</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Həftəlik Analitika Hesabatı
Mağaza: ${report.storeName}
Dövr: ${new Date(report.period.start).toLocaleDateString('az-AZ')} - ${new Date(report.period.end).toLocaleDateString('az-AZ')}

Əsas Göstəricilər:
- Baxışlar: ${report.metrics.views.toLocaleString()} (${report.metrics.viewsChange >= 0 ? '+' : ''}${report.metrics.viewsChange.toFixed(1)}%)
- Sevimlilər: ${report.metrics.favorites.toLocaleString()} (${report.metrics.favoritesChange >= 0 ? '+' : ''}${report.metrics.favoritesChange.toFixed(1)}%)
- Satışlar: ${report.metrics.sales.toLocaleString()} (${report.metrics.salesChange >= 0 ? '+' : ''}${report.metrics.salesChange.toFixed(1)}%)
- Gəlir: ${report.metrics.revenue.toLocaleString()} AZN (${report.metrics.revenueChange >= 0 ? '+' : ''}${report.metrics.revenueChange.toFixed(1)}%)

Ən Populyar Elanlar:
${report.topListings.map((l, i) => `${i + 1}. ${l.title} - ${l.views} baxış, ${l.sales} satış`).join('\n')}

Hörmətlə,
NaxtaPaz Komandası
    `;

    return emailService.sendEmail({
      to: email,
      subject: `📊 Həftəlik Hesabat - ${report.storeName}`,
      html,
      text,
    });
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Anonymize analytics data for sharing
   */
  anonymizeData(report: StoreReport): Partial<StoreReport> {
    try {
      logger.info('[ReportService] Anonymizing analytics data');

      // ✅ Remove all personal identifiers
      return {
        // ❌ Remove store identifiers
        // storeId: REMOVED
        // storeName: REMOVED

        period: report.period,

        // ✅ Keep aggregated metrics (no personal data)
        metrics: {
          ...report.metrics,
        },

        // ✅ Anonymize top listings (remove IDs and specific titles)
        topListings: report.topListings.map((listing, index) => ({
          id: '', // ❌ Remove ID
          title: `Product ${index + 1}`, // ✅ Generic title
          views: listing.views,
          sales: listing.sales,
          revenue: Math.round(listing.revenue), // ✅ Round to hide exact amounts
        })),

        // ✅ Keep demographic data (aggregated, no personal info)
        demographics: report.demographics,
      };
    } catch (error) {
      logger.error('[ReportService] Error anonymizing data:', error);
      throw new Error('Failed to anonymize data');
    }
  }

  /**
   * Export analytics data in various formats
   */
  async exportData(
    storeId: string,
    format: 'json' | 'csv' | 'excel',
    anonymous: boolean = false
  ): Promise<string | null> {
    try {
      // ✅ Validate inputs
      if (!storeId || typeof storeId !== 'string' || storeId.trim().length === 0) {
        logger.error('[ReportService] Invalid storeId for export');
        throw new Error('Invalid store ID');
      }

      const validFormats = ['json', 'csv', 'excel'];
      if (!validFormats.includes(format)) {
        logger.error(`[ReportService] Invalid export format: ${format}`);
        throw new Error('Invalid export format');
      }

      logger.info(`[ReportService] Exporting data for store: ${storeId}, format: ${format}, anonymous: ${anonymous}`);

      // Fetch report data
      const report = await this.fetchStoreReport(storeId, 'weekly');

      // ✅ Anonymize if requested
      const data = anonymous ? this.anonymizeData(report) : report;

      // ✅ Convert to requested format
      switch (format) {
        case 'json':
          return JSON.stringify(data, null, 2);

        case 'csv':
          return this.convertToCSV(data);

        case 'excel':
          // In a real app, use a library like ExcelJS
          logger.warn('[ReportService] Excel export not yet implemented');
          return null;

        default:
          return null;
      }
    } catch (error) {
      logger.error('[ReportService] Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: Partial<StoreReport>): string {
    try {
      const lines: string[] = [];

      // Header
      lines.push('Metric,Value,Change');

      // Metrics
      if (data.metrics) {
        lines.push(`Views,${data.metrics.views},${data.metrics.viewsChange}%`);
        lines.push(`Favorites,${data.metrics.favorites},${data.metrics.favoritesChange}%`);
        lines.push(`Messages,${data.metrics.messages},${data.metrics.messagesChange}%`);
        lines.push(`Followers,${data.metrics.followers},${data.metrics.followersChange}%`);
        lines.push(`Sales,${data.metrics.sales},${data.metrics.salesChange}%`);
        lines.push(`Revenue,${data.metrics.revenue},${data.metrics.revenueChange}%`);
        lines.push(`Avg Rating,${data.metrics.avgRating},${data.metrics.ratingChange}`);
        lines.push(`Active Listings,${data.metrics.activeListings},`);
        lines.push(`Total Listings,${data.metrics.totalListings},`);
      }

      // Empty line
      lines.push('');

      // Top listings
      if (data.topListings && data.topListings.length > 0) {
        lines.push('Top Listings:');
        lines.push('Title,Views,Sales,Revenue');
        data.topListings.forEach(listing => {
          lines.push(`${listing.title},${listing.views},${listing.sales},${listing.revenue}`);
        });
      }

      return lines.join('\n');
    } catch (error) {
      logger.error('[ReportService] Error converting to CSV:', error);
      throw new Error('Failed to convert to CSV');
    }
  }

  /**
   * Share analytics data with a specific user/email
   */
  async shareAnalytics(
    storeId: string,
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    anonymous: boolean = false
  ): Promise<boolean> {
    try {
      // ✅ Validate inputs
      if (!storeId || typeof storeId !== 'string' || storeId.trim().length === 0) {
        logger.error('[ReportService] Invalid storeId for sharing');
        throw new Error('Invalid store ID');
      }

      if (!recipientEmail || !this.isValidEmail(recipientEmail)) {
        logger.error('[ReportService] Invalid recipient email');
        throw new Error('Invalid recipient email');
      }

      if (!recipientName || typeof recipientName !== 'string' || recipientName.trim().length === 0) {
        logger.error('[ReportService] Invalid recipient name');
        throw new Error('Invalid recipient name');
      }

      if (!senderName || typeof senderName !== 'string' || senderName.trim().length === 0) {
        logger.error('[ReportService] Invalid sender name');
        throw new Error('Invalid sender name');
      }

      logger.info(`[ReportService] Sharing analytics from ${senderName} to ${recipientEmail}`);

      // Fetch report
      const report = await this.fetchStoreReport(storeId, 'weekly');

      // ✅ Anonymize if requested
      const data = anonymous ? this.anonymizeData(report) : report;

      // ✅ Send email with shared data
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Paylaşılan Analitika</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>📊 Analitika Paylaşıldı</h2>
          <p>Salam ${recipientName},</p>
          <p><strong>${senderName}</strong> sizinlə analitika məlumatlarını paylaşdı.</p>
          
          ${
            anonymous
              ? '<p style="background: #FFF3CD; padding: 12px; border-radius: 6px;">🕵️ Bu məlumatlar anonim formatdadır.</p>'
              : ''
          }
          
          <h3>Əsas Göstəricilər:</h3>
          <ul>
            <li>Baxışlar: ${data.metrics?.views.toLocaleString()}</li>
            <li>Sevimlilər: ${data.metrics?.favorites.toLocaleString()}</li>
            <li>Satışlar: ${data.metrics?.sales.toLocaleString()}</li>
            <li>Gəlir: ${data.metrics?.revenue.toLocaleString()} AZN</li>
          </ul>
          
          <p style="margin-top: 30px; font-size: 13px; color: #666;">
            Hörmətlə,<br>NaxtaPaz Komandası
          </p>
        </body>
        </html>
      `;

      return emailService.sendEmail({
        to: recipientEmail,
        subject: `📊 Analitika Paylaşıldı - ${senderName}`,
        html,
      });
    } catch (error) {
      logger.error('[ReportService] Error sharing analytics:', error);
      throw error;
    }
  }
}

export const reportService = new ReportService();
