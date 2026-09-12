const nodemailer = require("nodemailer");

let transporter;

const initializeTransporter = () => {
  if (transporter) return transporter;

  const emailService = process.env.EMAIL_SERVICE || "gmail";
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    throw new Error(
      "EMAIL_USER and EMAIL_PASSWORD must be set in environment variables",
    );
  }

  if (emailService === "custom") {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      service: emailService,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }

  return transporter;
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000);
};

/**
 * Send OTP via email
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code to send
 * @param {string} type - Type of OTP: 'registration' or 'reset'
 */
const sendOTPEmail = async (email, otp, type = "registration") => {
  try {
    const transport = initializeTransporter();

    const subject =
      type === "registration"
        ? "EduTrack - Email Verification OTP"
        : "EduTrack - Password Reset OTP";

    const message =
      type === "registration"
        ? "Please verify your email to complete your registration."
        : "Please use this OTP to reset your password.";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">EduTrack Account Verification</h2>
        <p style="color: #666; font-size: 16px;">${message}</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <p style="color: #999; font-size: 14px; margin: 0 0 10px 0;">Your verification code:</p>
          <p style="font-size: 32px; font-weight: bold; color: #2c3e50; letter-spacing: 5px; margin: 0;">
            ${otp}
          </p>
          <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">This code will expire in 10 minutes</p>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If you didn't request this code, please ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          EduTrack Student Portal<br>
          © 2024 All rights reserved
        </p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    await transport.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw error;
  }
};

/**
 * Verify OTP code
 * @param {string} providedOTP - OTP provided by user
 * @param {Object} otpRecord - OTP record from database { code, expiresAt }
 * @returns {Object} { valid: boolean, message: string }
 */
const verifyOTP = (providedOTP, otpRecord) => {
  if (!otpRecord || !otpRecord.code) {
    return { valid: false, message: "No OTP found. Please request a new one." };
  }

  if (Date.now() > otpRecord.expiresAt) {
    return {
      valid: false,
      message: "OTP has expired. Please request a new one.",
    };
  }

  if (providedOTP.toString() !== otpRecord.code.toString()) {
    return { valid: false, message: "Invalid OTP. Please try again." };
  }

  return { valid: true, message: "OTP verified successfully." };
};

const clearOTP = (otpRecord) => {
  return {
    code: null,
    expiresAt: null,
  };
};

module.exports = {
  generateOTP,
  getOTPExpiry,
  sendOTPEmail,
  verifyOTP,
  clearOTP,
};
