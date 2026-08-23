require('dotenv').config();
const nodemailer = require('nodemailer');

const user = (process.env.EMAIL_USER || '').trim().replace(/^["']|["']$/g, '');
const pass = (process.env.EMAIL_PASS || '').trim().replace(/^["']|["']$/g, '');
const host = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim().replace(/^["']|["']$/g, '');
const port = parseInt((process.env.EMAIL_PORT || '587').trim().replace(/^["']|["']$/g, '')) || 587;

console.log('--- EcoRide AI SMTP Diagnostic Tool ---');
console.log(`Configured Email User: "${user}"`);
console.log(`Configured Email Host: "${host}"`);
console.log(`Configured Email Port: ${port}`);
console.log(`SMTP Password Length: ${pass.length} characters`);

if (!user || user === 'your_email@gmail.com' || !pass || pass === 'your_app_password') {
  console.log('\n❌ ERROR: You are still using placeholder credentials in server/.env.');
  console.log('Please replace "your_email@gmail.com" and "your_app_password" with your actual Gmail details.');
  process.exit(1);
}

const isGmail = host === 'smtp.gmail.com' || user.endsWith('@gmail.com');
let transporter;

if (isGmail) {
  console.log('\n📦 Setup: Using nodemailer Gmail service configuration...');
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
} else {
  console.log('\n📦 Setup: Using custom SMTP host/port configuration...');
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

const mailOptions = {
  from: `"EcoRide AI Diagnostic" <${user}>`,
  to: user, // send to yourself
  subject: '🧪 EcoRide AI - SMTP Connection Test',
  html: '<h3>Hello!</h3><p>Your EcoRide AI SMTP server is successfully connected and delivering emails.</p>'
};

console.log('\n⚡ Attempting to connect and send test email...');
transporter.sendMail(mailOptions)
  .then(info => {
    console.log('\n✅ SUCCESS!');
    console.log(`Message ID: ${info.messageId}`);
    console.log(`Envelope: ${JSON.stringify(info.envelope)}`);
    console.log(`Response: ${info.response}`);
    console.log('\nPlease check your Gmail Inbox (and your Spam folder) for the test email!');
  })
  .catch(err => {
    console.log('\n❌ SMTP SEND FAILURE:');
    console.error(err);
  });
