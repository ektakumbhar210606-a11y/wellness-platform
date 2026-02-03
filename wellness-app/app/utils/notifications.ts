import BookingModel from '@/models/Booking';
import BusinessModel from '@/models/Business';
import UserModel from '@/models/User';
import { IBooking } from '@/models/Booking';
import EmailService from './emailService';

interface NotificationData {
  booking: IBooking;
  businessEmail?: string;
  businessName?: string;
  customerEmail?: string;
  customerName?: string;
  therapistName?: string;
  serviceDetails?: string;
}

class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Send notification based on booking status and notification destination
   */
  public async sendBookingNotification(
    bookingId: string,
    action: 'confirm' | 'cancel' | 'reschedule',
    additionalInfo?: { newDate?: string; newTime?: string }
  ): Promise<boolean> {
    try {
      // Fetch booking with populated data
      const booking = await BookingModel.findById(bookingId)
        .populate('customer')
        .populate('therapist')
        .populate('service');

      if (!booking) {
        console.error('Booking not found for notification:', bookingId);
        return false;
      }

      // Get business data from service
      const service = await import('@/models/Service');
      const ServiceModel = service.default;
      const populatedService: any = await ServiceModel.findById(booking.service)
        .populate('business');

      let businessData: any = populatedService?.business;
      if (!businessData) {
        // Fallback: try to find business associated with the service
        businessData = await BusinessModel.findOne({ services: booking.service });
      }

      const notificationData: NotificationData = {
        booking: booking.toObject(),
        businessEmail: businessData?.email || businessData?.ownerEmail,
        businessName: businessData?.business_name || businessData?.name,
        customerEmail: (booking.customer as any)?.email,
        customerName: `${(booking.customer as any)?.firstName || ''} ${(booking.customer as any)?.lastName || ''}`.trim(),
        therapistName: (booking.therapist as any)?.fullName,
        serviceDetails: (booking.service as any)?.name
      };

      // Determine notification destination
      const destination = booking.notificationDestination || 'customer';

      if (destination === 'business') {
        return await this.sendNotificationToBusiness(notificationData, action, additionalInfo);
      } else {
        return await this.sendNotificationToCustomer(notificationData, action, additionalInfo);
      }
    } catch (error) {
      console.error('Error sending booking notification:', error);
      return false;
    }
  }

  /**
   * Send notification to business about booking status change
   */
  private async sendNotificationToBusiness(
    data: NotificationData,
    action: 'confirm' | 'cancel' | 'reschedule',
    additionalInfo?: { newDate?: string; newTime?: string }
  ): Promise<boolean> {
    const { booking, businessEmail, businessName, customerName, therapistName, serviceDetails } = data;

    if (!businessEmail) {
      console.error('No business email found for notification');
      return false;
    }

    let subject = '';
    let htmlContent = '';

    switch (action) {
      case 'confirm':
        subject = `Booking Confirmed: ${serviceDetails} for ${customerName}`;
        htmlContent = this.generateBusinessConfirmationEmail(data);
        break;
      case 'cancel':
        subject = `Booking Cancelled: ${serviceDetails} for ${customerName}`;
        htmlContent = this.generateBusinessCancellationEmail(data);
        break;
      case 'reschedule':
        subject = `Booking Rescheduled: ${serviceDetails} for ${customerName}`;
        htmlContent = this.generateBusinessRescheduleEmail(data, additionalInfo);
        break;
      default:
        console.error('Invalid action for notification:', action);
        return false;
    }

    return await this.emailService.sendEmail({
      to: businessEmail,
      subject,
      html: htmlContent
    });
  }

  /**
   * Send notification to customer about booking status change
   */
  private async sendNotificationToCustomer(
    data: NotificationData,
    action: 'confirm' | 'cancel' | 'reschedule',
    additionalInfo?: { newDate?: string; newTime?: string }
  ): Promise<boolean> {
    const { booking, customerEmail, customerName, therapistName, serviceDetails } = data;

    if (!customerEmail) {
      console.error('No customer email found for notification');
      return false;
    }

    let subject = '';
    let htmlContent = '';

    switch (action) {
      case 'confirm':
        subject = `Your Booking for ${serviceDetails} Has Been Confirmed`;
        htmlContent = this.generateCustomerConfirmationEmail(data);
        break;
      case 'cancel':
        subject = `Your Booking for ${serviceDetails} Has Been Cancelled`;
        htmlContent = this.generateCustomerCancellationEmail(data);
        break;
      case 'reschedule':
        subject = `Your Booking for ${serviceDetails} Has Been Rescheduled`;
        htmlContent = this.generateCustomerRescheduleEmail(data, additionalInfo);
        break;
      default:
        console.error('Invalid action for notification:', action);
        return false;
    }

    return await this.emailService.sendEmail({
      to: customerEmail,
      subject,
      html: htmlContent
    });
  }

  /**
   * Generate email content for business confirmation notification
   */
  private generateBusinessConfirmationEmail(data: NotificationData): string {
    const { booking, customerName, therapistName, serviceDetails } = data;
    const bookingDate = new Date(booking.date).toLocaleDateString();
    const bookingTime = booking.time;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmed</title>
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
                    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Booking Confirmed</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                      A therapist has confirmed a booking that was assigned to them.
                    </p>
                    
                    <div style="background-color: #f8f9ff; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left;">
                      <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Booking Details:</h3>
                      <p style="margin: 8px 0; color: #555;"><strong>Service:</strong> ${serviceDetails}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Customer:</strong> ${customerName}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Therapist:</strong> ${therapistName}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Date:</strong> ${bookingDate}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Time:</strong> ${bookingTime}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Status:</strong> <span style="color: #52c41a; font-weight: bold;">Confirmed</span></p>
                    </div>
                    
                    <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 20px 0 10px 0;">
                      As the business owner, you have been notified of this change. You may now communicate with the customer as needed.
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
  }

  /**
   * Generate email content for business cancellation notification
   */
  private generateBusinessCancellationEmail(data: NotificationData): string {
    const { booking, customerName, therapistName, serviceDetails } = data;
    const bookingDate = new Date(booking.date).toLocaleDateString();
    const bookingTime = booking.time;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Cancelled</title>
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
                    <h2 style="color: #d32f2f; margin: 0 0 20px 0; font-size: 24px;">Booking Cancelled</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                      A therapist has cancelled a booking that was assigned to them.
                    </p>
                    
                    <div style="background-color: #fff0f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left;">
                      <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Booking Details:</h3>
                      <p style="margin: 8px 0; color: #555;"><strong>Service:</strong> ${serviceDetails}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Customer:</strong> ${customerName}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Therapist:</strong> ${therapistName}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Date:</strong> ${bookingDate}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Time:</strong> ${bookingTime}</p>
                      <p style="margin: 8px 0; color: #d32f2f; font-weight: bold;">Status: Cancelled</p>
                    </div>
                    
                    <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 20px 0 10px 0;">
                      As the business owner, you have been notified of this cancellation. You may now communicate with the customer as needed.
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
  }

  /**
   * Generate email content for business reschedule notification
   */
  private generateBusinessRescheduleEmail(
    data: NotificationData,
    additionalInfo?: { newDate?: string; newTime?: string }
  ): string {
    const { booking, customerName, therapistName, serviceDetails } = data;
    const bookingDate = new Date(booking.date).toLocaleDateString();
    const bookingTime = booking.time;
    const newDate = additionalInfo?.newDate ? new Date(additionalInfo.newDate).toLocaleDateString() : '';
    const newTime = additionalInfo?.newTime || '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Rescheduled</title>
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
                    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Booking Rescheduled</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                      A therapist has rescheduled a booking that was assigned to them.
                    </p>
                    
                    <div style="background-color: #fff8e1; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left;">
                      <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Original Booking:</h3>
                      <p style="margin: 8px 0; color: #555;"><strong>Service:</strong> ${serviceDetails}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Customer:</strong> ${customerName}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Therapist:</strong> ${therapistName}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Date:</strong> ${bookingDate}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Time:</strong> ${bookingTime}</p>
                      
                      <h3 style="color: #333; margin: 15px 0 15px 0; font-size: 18px;">New Booking:</h3>
                      <p style="margin: 8px 0; color: #555;"><strong>New Date:</strong> ${newDate}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>New Time:</strong> ${newTime}</p>
                    </div>
                    
                    <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 20px 0 10px 0;">
                      As the business owner, you have been notified of this rescheduling. You may now communicate with the customer as needed.
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
  }

  /**
   * Generate email content for customer confirmation notification
   */
  private generateCustomerConfirmationEmail(data: NotificationData): string {
    const { booking, customerName, therapistName, serviceDetails } = data;
    const bookingDate = new Date(booking.date).toLocaleDateString();
    const bookingTime = booking.time;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Booking Has Been Confirmed</title>
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
                    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Your Booking Has Been Confirmed!</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                      Great news! Your booking has been confirmed.
                    </p>
                    
                    <div style="background-color: #f8f9ff; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left;">
                      <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Booking Details:</h3>
                      <p style="margin: 8px 0; color: #555;"><strong>Service:</strong> ${serviceDetails}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Therapist:</strong> ${therapistName}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Date:</strong> ${bookingDate}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Time:</strong> ${bookingTime}</p>
                      <p style="margin: 8px 0; color: #52c41a; font-weight: bold;">Status: Confirmed</p>
                    </div>
                    
                    <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 20px 0 10px 0;">
                      We look forward to seeing you at your appointment. If you have any questions, please contact us.
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
  }

  /**
   * Generate email content for customer cancellation notification
   */
  private generateCustomerCancellationEmail(data: NotificationData): string {
    const { booking, customerName, therapistName, serviceDetails } = data;
    const bookingDate = new Date(booking.date).toLocaleDateString();
    const bookingTime = booking.time;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Booking Has Been Cancelled</title>
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
                    <h2 style="color: #d32f2f; margin: 0 0 20px 0; font-size: 24px;">Your Booking Has Been Cancelled</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                      Your booking has been cancelled.
                    </p>
                    
                    <div style="background-color: #fff0f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left;">
                      <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Booking Details:</h3>
                      <p style="margin: 8px 0; color: #555;"><strong>Service:</strong> ${serviceDetails}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Therapist:</strong> ${therapistName}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Date:</strong> ${bookingDate}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Time:</strong> ${bookingTime}</p>
                      <p style="margin: 8px 0; color: #d32f2f; font-weight: bold;">Status: Cancelled</p>
                    </div>
                    
                    <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 20px 0 10px 0;">
                      If you'd like to reschedule, please visit our website or contact us directly.
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
  }

  /**
   * Generate email content for customer reschedule notification
   */
  private generateCustomerRescheduleEmail(
    data: NotificationData,
    additionalInfo?: { newDate?: string; newTime?: string }
  ): string {
    const { booking, customerName, therapistName, serviceDetails } = data;
    const bookingDate = new Date(booking.date).toLocaleDateString();
    const bookingTime = booking.time;
    const newDate = additionalInfo?.newDate ? new Date(additionalInfo.newDate).toLocaleDateString() : '';
    const newTime = additionalInfo?.newTime || '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Booking Has Been Rescheduled</title>
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
                    <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Your Booking Has Been Rescheduled</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                      Your booking has been rescheduled to a new date and time.
                    </p>
                    
                    <div style="background-color: #fff8e1; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left;">
                      <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Original Booking:</h3>
                      <p style="margin: 8px 0; color: #555;"><strong>Service:</strong> ${serviceDetails}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Therapist:</strong> ${therapistName}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Date:</strong> ${bookingDate}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>Time:</strong> ${bookingTime}</p>
                      
                      <h3 style="color: #333; margin: 15px 0 15px 0; font-size: 18px;">New Booking:</h3>
                      <p style="margin: 8px 0; color: #555;"><strong>New Date:</strong> ${newDate}</p>
                      <p style="margin: 8px 0; color: #555;"><strong>New Time:</strong> ${newTime}</p>
                    </div>
                    
                    <p style="color: #888; font-size: 14px; line-height: 1.5; margin: 20px 0 10px 0;">
                      Your booking has been updated with the new date and time. If you have any concerns, please contact us.
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
  }
}

export default NotificationService;