const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return false;
  }
};

// Welcome email
const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: '🌱 Welcome to EcoRide AI!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🌱 EcoRide AI</h1>
          <p style="color: #d1fae5; margin: 5px 0;">Share Smarter. Travel Greener.</p>
        </div>
        <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
          <h2 style="color: #065f46;">Welcome, ${user.name}! 👋</h2>
          <p style="color: #374151;">Thank you for joining EcoRide AI. Together, we can make travel more sustainable.</p>
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #065f46; margin: 0;"><strong>🎁 Welcome Bonus:</strong> 100 Eco Points added to your account!</p>
          </div>
          <a href="${process.env.CLIENT_URL}/dashboard" 
             style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">
            Start Your Eco Journey →
          </a>
        </div>
      </div>
    `
  });
};

// OTP email
const sendOTPEmail = async (user, otp) => {
  await sendEmail({
    to: user.email,
    subject: '🔐 EcoRide AI - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🌱 EcoRide AI</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #065f46;">Verify Your Email</h2>
          <p style="color: #374151;">Use the OTP below to verify your email address:</p>
          <div style="background: #065f46; color: white; padding: 20px; text-align: center; border-radius: 8px; font-size: 36px; font-weight: bold; letter-spacing: 10px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #6b7280; font-size: 14px;">This OTP expires in 10 minutes.</p>
        </div>
      </div>
    `
  });
};

// Booking confirmation email
const sendBookingConfirmationEmail = async (user, booking, ride) => {
  await sendEmail({
    to: user.email,
    subject: '✅ EcoRide AI - Booking Confirmed!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🌱 EcoRide AI</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #065f46;">✅ Booking Confirmed!</h2>
          <p style="color: #374151;">Your ride has been booked successfully.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <p><strong>📍 From:</strong> ${ride.origin.address}</p>
            <p><strong>📍 To:</strong> ${ride.destination.address}</p>
            <p><strong>📅 Date:</strong> ${new Date(ride.departureTime).toLocaleDateString()}</p>
            <p><strong>🕐 Time:</strong> ${new Date(ride.departureTime).toLocaleTimeString()}</p>
            <p><strong>💺 Seats:</strong> ${booking.seatsBooked}</p>
            <p><strong>💰 Amount:</strong> ₹${booking.totalAmount}</p>
            <p><strong>🌱 CO₂ Saved:</strong> ${booking.carbonSaved} kg</p>
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
  sendBookingConfirmationEmail 
};