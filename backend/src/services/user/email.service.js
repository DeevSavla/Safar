import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * EmailService - Handles sending emails
 */
class EmailService {
  constructor() {
    // Create reusable transporter
    this.transporter = nodemailer.createTransport({
        service: "Gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: true,
        auth: {
          user: process.env.GMAIL_USERNAME,
          pass: process.env.GMAIL_PASSWORD,
        },
      });
  }

  /**
   * Send OTP email to the user
   * @param {String} to - Recipient email
   * @param {String} otp - One-time password
   * @returns {Promise} Nodemailer response
   */
  async sendOTPEmail(to, otp) {
    console.log(to, otp);
    const mailOptions = {
      from: process.env.GMAIL_USERNAME,
      to,
      subject: 'Your Login OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a6fa5;">Travel Planner - Login Verification</h2>
          <p>Hello,</p>
          <p>Your one-time password (OTP) for login is:</p>
          <div style="background-color: #f5f5f5; padding: 12px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0; border-radius: 5px;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this OTP, please ignore this message.</p>
          <p>Regards,<br>Travel Planner Team</p>
        </div>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  /**
   * Send group itinerary invitation email
   * @param {String} to - Recipient email
   * @param {Object} data - Invitation data
   * @param {String} data.inviterName - Name of the user sending the invitation
   * @param {String} data.itineraryTitle - Title of the itinerary
   * @param {String} data.itineraryId - ID of the itinerary
   * @param {String} data.role - Role assigned to the invited user
   * @returns {Promise} Nodemailer response
   */
  async sendGroupItineraryInvitation(to, data) {
    console.log('Sending group itinerary invitation to:', to);
    
    const mailOptions = {
      from: process.env.GMAIL_USERNAME,
      to,
      subject: `You've Been Invited to Collaborate on "${data.itineraryTitle}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a6fa5;">Travel Planner - Group Itinerary Invitation</h2>
          <p>Hello,</p>
          <p>${data.inviterName} has invited you to collaborate on their travel itinerary "${data.itineraryTitle}".</p>
          <p>You have been assigned the role of <strong>${data.role}</strong>.</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="${process.env.FRONTEND_URL}/itineraries/${data.itineraryId}" 
              style="background-color: #4a6fa5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
              View Itinerary
            </a>
          </div>
          <p>If you didn't expect this invitation, please contact ${data.inviterName}.</p>
          <p>Regards,<br>Travel Planner Team</p>
        </div>
      `
    };

    return this.transporter.sendMail(mailOptions);
  }

  /**
   * Send email notification about a new join request to itinerary owner
   * @param {String} to - Email address of the recipient (owner)
   * @param {Object} data - Email data
   * @returns {Promise}
   */
  async sendJoinRequestNotification(to, data) {
    const subject = `Join Request: ${data.requesterName} wants to join your itinerary`;
    
    const requestDate = data.requestDate ? new Date(data.requestDate).toLocaleDateString() : new Date().toLocaleDateString();
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4f46e5;">New Join Request</h2>
        <p>Hello ${data.ownerName},</p>
        <p><strong>${data.requesterName}</strong> (${data.requesterEmail}) has requested to join your itinerary <strong>${data.itineraryTitle}</strong>.</p>
        <div style="background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 15px; margin: 15px 0;">
          <p style="margin: 0;"><strong>Request Details:</strong></p>
          <p style="margin: 5px 0;">• From: ${data.requesterName} (${data.requesterEmail})</p>
          <p style="margin: 5px 0;">• Itinerary: ${data.itineraryTitle}</p>
          <p style="margin: 5px 0;">• Requested on: ${requestDate}</p>
        </div>
        <p>You can approve or reject this request from your itinerary details page.</p>
        <div style="margin: 25px 0;">
          <a href="${this.getBaseUrl()}/itineraries/${data.itineraryId}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Join Requests
          </a>
        </div>
        <p style="font-size: 0.9em; color: #666;">This is an automated message from the Travel Planner App.</p>
      </div>
    `;
    
    return this.sendEmail(to, subject, html);
  }

  /**
   * Send approval notification for join request
   * @param {String} to - Email address of the requester
   * @param {Object} data - Email data
   * @returns {Promise}
   */
  async sendJoinRequestApproval(to, data) {
    const subject = `Your request to join "${data.itineraryTitle}" has been approved`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #10b981;">Join Request Approved</h2>
        <p>Hello ${data.userName},</p>
        <p>Your request to join the itinerary <strong>${data.itineraryTitle}</strong> has been approved!</p>
        <p>You can now view this itinerary in your account.</p>
        <div style="margin: 25px 0;">
          <a href="${this.getBaseUrl()}/itineraries/${data.itineraryId}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Itinerary
          </a>
        </div>
        <p style="font-size: 0.9em; color: #666;">This is an automated message from the Travel Planner App.</p>
      </div>
    `;
    
    return this.sendEmail(to, subject, html);
  }

  /**
   * Send rejection notification for join request
   * @param {String} to - Email address of the requester
   * @param {Object} data - Email data
   * @returns {Promise}
   */
  async sendJoinRequestRejection(to, data) {
    const subject = `Your request to join "${data.itineraryTitle}" was not approved`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #6b7280;">Join Request Update</h2>
        <p>Hello ${data.userName},</p>
        <p>Your request to join the itinerary <strong>${data.itineraryTitle}</strong> was not approved at this time.</p>
        <p>You can explore other public itineraries in the application.</p>
        <div style="margin: 25px 0;">
          <a href="${this.getBaseUrl()}/itineraries/explore" style="background-color: #6b7280; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Explore Itineraries
          </a>
        </div>
        <p style="font-size: 0.9em; color: #666;">This is an automated message from the Travel Planner App.</p>
      </div>
    `;
    
    return this.sendEmail(to, subject, html);
  }

  /**
   * Get the base URL for the frontend application
   * @returns {String} The base URL
   */
  getBaseUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Send an email using the configured transporter
   * @param {String} to - Recipient email
   * @param {String} subject - Email subject
   * @param {String} html - Email HTML content
   * @returns {Promise} Nodemailer response
   */
  async sendEmail(to, subject, html) {
    const mailOptions = {
      from: process.env.GMAIL_USERNAME,
      to,
      subject,
      html
    };

    return this.transporter.sendMail(mailOptions);
  }
}

export default new EmailService(); 