import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

type Transporter = nodemailer.Transporter;

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Verify transporter configuration
      await this.transporter.verify();

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@serenitywellness.com',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  public async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    // Use NEXT_PUBLIC_APP_URL for public-facing links, fallback to NEXT_PUBLIC_API_URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password/${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f7fa;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px 30px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 20px;">
                      🧘‍♀️ Serenity Wellness
                    </div>
                    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Password Reset Request</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">Hello,</p>
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                      We received a request to reset your password for your Serenity Wellness account.
                    </p>
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                      Please click the button below to reset your password:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetLink}" 
                         style="background-color: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: 600;">
                        Reset Password
                      </a>
                    </div>
                    <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 20px 0 10px 0;">
                      <strong>Having trouble clicking the button?</strong><br>
                      Copy and paste this link into your browser:<br>
                      <span style="word-break: break-all; color: #667eea;">${resetLink}</span>
                    </p>
                    <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 20px 0 10px 0;">
                      If you did not request a password reset, please ignore this email.
                    </p>
                    <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 10px 0 0 0;">
                      This link will expire in 15 minutes for security reasons.
                    </p>
                    <div style="border-top: 1px solid #eee; margin: 30px 0 20px 0;"></div>
                    <p style="color: #888; font-size: 14px; margin: 0;">
                      Best regards,<br>
                      <strong>The Serenity Wellness Team</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request - Serenity Wellness',
      html,
    });
  }
}

export default EmailService;