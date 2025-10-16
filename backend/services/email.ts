import { logger } from '../../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface VerificationEmailData {
  name: string;
  verificationUrl: string;
}

interface PasswordResetEmailData {
  name: string;
  resetUrl: string;
}

class EmailService {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.EMAIL_FROM || 'naxtapaz@gmail.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'NaxtaPaz';
    this.baseUrl = process.env.FRONTEND_URL || process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://1r36dhx42va8pxqbqz5ja.rork.app';
  }

  isConfigured(): boolean {
    return !!this.apiKey && !this.apiKey.includes('your-');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured()) {
      logger.warn('[Email] Resend not configured, skipping email send');
      return false;
    }

    try {
      // BUG FIX: Add timeout to prevent hanging requests
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          ...(options.text ? { text: options.text } : {}),
        }),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
< cursor/fix-many-bugs-and-errors-2981
        const errorText = await response.text();
        logger.error('[Email] Resend API error:', errorText);

        // BUG FIX: Handle response parsing errors
        let errorText = 'Unknown error';
        try {
          errorText = await response.text();
        } catch (parseError) {
          console.error('[Email] Failed to parse error response:', parseError);
        }
        console.error('[Email] Resend API error:', errorText);
> Araz
        return false;
      }

      logger.info(`[Email] Successfully sent email to ${options.to}`);
      return true;
    } catch (error) {
< cursor/fix-many-bugs-and-errors-2981
      logger.error('[Email] Failed to send email:', error);

      // BUG FIX: More detailed error logging
      if (error instanceof Error) {
        console.error('[Email] Failed to send email:', error.message);
      } else {
        console.error('[Email] Failed to send email:', error);
      }
> Araz
      return false;
    }
  }

  async sendVerificationEmail(email: string, data: VerificationEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Təsdiqi</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo h1 {
            color: #007AFF;
            margin: 0;
            font-size: 32px;
          }
          .content {
            margin-bottom: 30px;
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
          .button:hover {
            background: #0051D5;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
          .contact-info {
            margin-top: 20px;
            font-size: 13px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>NaxtaPaz</h1>
          </div>
          
          <div class="content">
            <h2>Salam ${data.name}!</h2>
            <p>NaxtaPaz platformasına xoş gəlmisiniz! Hesabınızı aktivləşdirmək üçün aşağıdakı düyməyə klikləyin:</p>
            
            <div style="text-align: center;">
              <a href="${data.verificationUrl}" class="button">Email-i Təsdiqlə</a>
            </div>
            
            <p>Əgər düymə işləmirsə, aşağıdakı linki brauzerinizə kopyalayın:</p>
            <p style="word-break: break-all; color: #007AFF;">${data.verificationUrl}</p>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              <strong>Qeyd:</strong> Bu link 24 saat ərzində etibarlıdır. Əgər siz bu qeydiyyatı tələb etməmisinizsə, bu emaili nəzərə almayın.
            </p>
          </div>
          
          <div class="footer">
            <p>Hörmətlə,<br>NaxtaPaz Komandası</p>
            <div class="contact-info">
              <p>Email: naxtapaz@gmail.com</p>
              <p>Telefon: +994504801313</p>
              <p>Ünvan: Naxçıvan, Azərbaycan</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Salam ${data.name}!

NaxtaPaz platformasına xoş gəlmisiniz! Hesabınızı aktivləşdirmək üçün aşağıdakı linki ziyarət edin:

${data.verificationUrl}

Bu link 24 saat ərzində etibarlıdır.

Hörmətlə,
NaxtaPaz Komandası

Email: naxtapaz@gmail.com
Telefon: +994504801313
Ünvan: Naxçıvan, Azərbaycan
    `;

    return this.sendEmail({
      to: email,
      subject: 'Email Təsdiqi - NaxtaPaz',
      html,
      text,
    });
  }

  async sendPasswordResetEmail(email: string, data: PasswordResetEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Şifrə Sıfırlama</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo h1 {
            color: #007AFF;
            margin: 0;
            font-size: 32px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: #FF3B30;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
          }
          .button:hover {
            background: #D70015;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
          .contact-info {
            margin-top: 20px;
            font-size: 13px;
            color: #888;
          }
          .warning {
            background: #FFF3CD;
            border: 1px solid #FFE69C;
            border-radius: 6px;
            padding: 12px;
            margin: 20px 0;
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>NaxtaPaz</h1>
          </div>
          
          <div class="content">
            <h2>Salam ${data.name}!</h2>
            <p>Şifrənizi sıfırlamaq üçün sorğu aldıq. Yeni şifrə təyin etmək üçün aşağıdakı düyməyə klikləyin:</p>
            
            <div style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Şifrəni Sıfırla</a>
            </div>
            
            <p>Əgər düymə işləmirsə, aşağıdakı linki brauzerinizə kopyalayın:</p>
            <p style="word-break: break-all; color: #007AFF;">${data.resetUrl}</p>
            
            <div class="warning">
              <strong>⚠️ Təhlükəsizlik Xəbərdarlığı:</strong><br>
              Bu link 1 saat ərzində etibarlıdır. Əgər siz bu sorğunu göndərməmisinizsə, dərhal bizimlə əlaqə saxlayın və şifrənizi dəyişdirin.
            </div>
          </div>
          
          <div class="footer">
            <p>Hörmətlə,<br>NaxtaPaz Komandası</p>
            <div class="contact-info">
              <p>Email: naxtapaz@gmail.com</p>
              <p>Telefon: +994504801313</p>
              <p>Ünvan: Naxçıvan, Azərbaycan</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Salam ${data.name}!

Şifrənizi sıfırlamaq üçün sorğu aldıq. Yeni şifrə təyin etmək üçün aşağıdakı linki ziyarət edin:

${data.resetUrl}

Bu link 1 saat ərzində etibarlıdır.

⚠️ Əgər siz bu sorğunu göndərməmisinizsə, dərhal bizimlə əlaqə saxlayın.

Hörmətlə,
NaxtaPaz Komandası

Email: naxtapaz@gmail.com
Telefon: +994504801313
Ünvan: Naxçıvan, Azərbaycan
    `;

    return this.sendEmail({
      to: email,
      subject: 'Şifrə Sıfırlama - NaxtaPaz',
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xoş Gəlmisiniz</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo h1 {
            color: #007AFF;
            margin: 0;
            font-size: 32px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: #34C759;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
          }
          .features {
            background: #F2F2F7;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .features ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .features li {
            margin: 8px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
          .contact-info {
            margin-top: 20px;
            font-size: 13px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>🎉 NaxtaPaz</h1>
          </div>
          
          <div class="content">
            <h2>Xoş gəlmisiniz, ${name}!</h2>
            <p>Email ünvanınız uğurla təsdiqləndi. İndi NaxtaPaz platformasının bütün imkanlarından istifadə edə bilərsiniz!</p>
            
            <div class="features">
              <h3>Platformamızda nələr edə bilərsiniz:</h3>
              <ul>
                <li>📱 Elanlar yerləşdirin və satışa çıxarın</li>
                <li>🏪 Öz mağazanızı yaradın</li>
                <li>💬 Alıcılarla birbaşa əlaqə saxlayın</li>
                <li>⭐ Rəy və reytinq sistemi</li>
                <li>🎯 Endirim və kampaniyalar</li>
                <li>📊 Analitika və statistika</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${this.baseUrl}" class="button">Platformaya Keç</a>
            </div>
          </div>
          
          <div class="footer">
            <p>Sualınız varsa, bizimlə əlaqə saxlayın!</p>
            <div class="contact-info">
              <p>Email: naxtapaz@gmail.com</p>
              <p>Telefon: +994504801313</p>
              <p>Ünvan: Naxçıvan, Azərbaycan</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Xoş Gəlmisiniz - NaxtaPaz',
      html,
    });
  }
}

export const emailService = new EmailService();
