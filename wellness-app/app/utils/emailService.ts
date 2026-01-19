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
    const resetLink = `${process.env.NEXT_PUBLIC_API_URL}/reset-password/${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your Serenity Wellness account.</p>
        <p>Please click the link below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>This link will expire in 15 minutes for security reasons.</p>
        <br/>
        <p>Best regards,<br/>The Serenity Wellness Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request - Serenity Wellness',
      html,
    });
  }
}

export default EmailService;