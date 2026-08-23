const nodemailer = require('nodemailer');

let transporter = null;
let cachedUser = null;
let cachedPass = null;

const getTransporter = () => {
  const user = (process.env.EMAIL_USER || '').trim().replace(/^["']|["']$/g, '');
  const pass = (process.env.EMAIL_PASS || '').trim().replace(/^["']|["']$/g, '');
  const host = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim().replace(/^["']|["']$/g, '');
  const port = parseInt((process.env.EMAIL_PORT || '587').trim().replace(/^["']|["']$/g, '')) || 587;

  if (!transporter || cachedUser !== user || cachedPass !== pass) {
    cachedUser = user;
    cachedPass = pass;
    const isGmail = host === 'smtp.gmail.com' || user.endsWith('@gmail.com');
    
    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
    } else {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
    }
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  const user = (process.env.EMAIL_USER || '').trim().replace(/^["']|["']$/g, '');
  const pass = (process.env.EMAIL_PASS || '').trim().replace(/^["']|["']$/g, '');
  const from = (process.env.EMAIL_FROM || '').trim().replace(/^["']|["']$/g, '');

  const isEmailConfigured = 
    user && 
    user !== 'your_email@gmail.com' &&
    pass &&
    pass !== 'your_app_password';

  if (!isEmailConfigured) {
    console.log('\n==================================================');
    console.log(`📧 [DEV EMAIL MOCK] - SMTP NOT CONFIGURED IN .ENV`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML: ${html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`);
    console.log('==================================================\n');
    return true;
  }

  try {
    const plainText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const mailOptions = {
      from: from || `"EcoRide AI Support" <${user}>`,
      to,
      subject,
      text: plainText,
      html,
      headers: {
        'X-Priority': '1 (Highest)',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    };
    
    const mailTransporter = getTransporter();
    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    console.log('\n==================================================');
    console.log(`📧 [DEV EMAIL FALLBACK - SMTP FAILED]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML: ${html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`);
    console.log('==================================================\n');
    return true;
  }
};

// Welcome email
const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to EcoRide AI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
        <div style="background: #10b981; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">EcoRide AI</h1>
        </div>
        <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <h2 style="color: #065f46; margin-top: 0;">Welcome, ${user.name}!</h2>
          <p>Thank you for joining EcoRide AI. Together, we can make travel more sustainable.</p>
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #a7f3d0;">
            <p style="color: #065f46; margin: 0;"><strong>🎁 Welcome Bonus:</strong> 100 Eco Points added to your account!</p>
          </div>
          <p>Start sharing rides and offset carbon emissions today.</p>
        </div>
      </div>
    `
  });
};

// OTP registration email
const sendOTPEmail = async (user, otp) => {
  await sendEmail({
    to: user.email,
    subject: `EcoRide Verification Code: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
        <div style="background: #10b981; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">EcoRide AI</h1>
        </div>
        <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <h2 style="color: #065f46; margin-top: 0;">Verify Your Email Address</h2>
          <p>Use the secure verification code below to verify your email address:</p>
          <div style="background: #f3f4f6; color: #111827; padding: 15px; text-align: center; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `
  });
};

// OTP password reset email
const sendResetOTPEmail = async (user, otp) => {
  await sendEmail({
    to: user.email,
    subject: `EcoRide Reset Code: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
        <div style="background: #10b981; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">EcoRide AI</h1>
        </div>
        <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <h2 style="color: #065f46; margin-top: 0;">Reset Your Password</h2>
          <p>Use the secure verification code below to reset your account password:</p>
          <div style="background: #f3f4f6; color: #111827; padding: 15px; text-align: center; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `
  });
};

// Booking confirmation email
const sendBookingConfirmationEmail = async (user, booking, ride) => {
  await sendEmail({
    to: user.email,
    subject: 'EcoRide Booking Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
        <div style="background: #10b981; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">EcoRide AI</h1>
        </div>
        <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <h2 style="color: #065f46; margin-top: 0;">Booking Confirmed!</h2>
          <p>Your ride has been successfully booked. Trip details are listed below:</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb; line-height: 1.6;">
            <div><strong>📍 Pickup:</strong> ${ride.origin.address}</div>
            <div><strong>📍 Dropoff:</strong> ${ride.destination.address}</div>
            <div><strong>📅 Date:</strong> ${new Date(ride.departureTime).toLocaleDateString()}</div>
            <div><strong>🕐 Time:</strong> ${new Date(ride.departureTime).toLocaleTimeString()}</div>
            <div><strong>💺 Seats:</strong> ${booking.seatsBooked}</div>
            <div><strong>💰 Fare paid:</strong> ₹${booking.totalAmount}</div>
            <div><strong>🌱 CO₂ Saved:</strong> ${booking.carbonSaved} kg</div>
          </div>
        </div>
      </div>
    `
  });
};

module.exports = { 
  sendEmail, 
  sendWelcomeEmail, 
  sendOTPEmail,
  sendResetOTPEmail,
  sendBookingConfirmationEmail 
};