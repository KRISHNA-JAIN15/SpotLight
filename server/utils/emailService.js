const nodemailer = require("nodemailer");

// Create transporter using existing config
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send verification email
const sendVerificationEmail = async (email, verificationCode, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Spotlight Events" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify Your Email - Spotlight Events",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .code-box { 
              background: #fff; 
              border: 2px solid #6366f1; 
              border-radius: 8px; 
              padding: 20px; 
              text-align: center; 
              margin: 20px 0;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 4px;
              color: #6366f1;
            }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Spotlight Events!</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>Thank you for signing up with Spotlight Events. To complete your registration and start discovering amazing events near you, please use the verification code below:</p>
              
              <div class="code-box">
                ${verificationCode}
              </div>
              
              <p>Enter this 6-digit code in the verification screen to activate your account.</p>
              
              <p><strong>Note:</strong> This verification code will expire in 10 minutes for security reasons.</p>
              
              <p>If you didn't create an account with us, please ignore this email.</p>
              
              <p>Best regards,<br>The Spotlight Events Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Spotlight Events. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    const transporter = createTransporter();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Spotlight Events" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset - Spotlight Events",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { 
              display: inline-block; 
              background: #ef4444; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
            }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>We received a request to reset your password for your Spotlight Events account. If you made this request, click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #ef4444;">${resetUrl}</p>
              
              <p><strong>Note:</strong> This password reset link will expire in 1 hour for security reasons.</p>
              
              <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
              
              <p>Best regards,<br>The Spotlight Events Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Spotlight Events. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully to:", email);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
