const axios = require('axios');

const sendEmail = async ({ to, subject, html }) => {
  const apiKey = (process.env.RESEND_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const fromEmail = (process.env.RESEND_FROM || 'EcoRide AI <onboarding@resend.dev>').trim().replace(/^["']|["']$/g, '');

  if (!apiKey) {
    console.log('\n==================================================');
    console.log(`📧 [DEV EMAIL MOCK] - RESEND_API_KEY NOT CONFIGURED IN .ENV`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML: ${html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`);
    console.log('==================================================\n');
    return true;
  }

  try {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: fromEmail,
        to: [to],
        subject: subject,
        html: html
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`📧 Email sent successfully via Resend API: ${response.data.id}`);
    return true;
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('❌ Resend API error:', errorDetails);
    
    console.log('\n==================================================');
    console.log(`📧 [DEV EMAIL FALLBACK - RESEND API FAILED]`);
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