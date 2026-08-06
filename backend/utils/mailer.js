const nodemailer = require('nodemailer');
const { getSmtpConfig } = require('./smtpConfig');

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    let transporter;
    const smtp = getSmtpConfig();
    const smtpUser = smtp.user;
    const smtpPass = smtp.pass;
    const isSmtpConfigured = smtpUser && smtpPass;

    if (isSmtpConfigured) {
      transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    } else {
      console.log('\n✉️  [MOCK EMAIL SENT]');
      console.log(`To:      ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:    ${text || html}`);
      console.log('--------------------\n');
      return { messageId: 'mock-id-' + Date.now(), previewUrl: 'Console logs fallback' };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"EcoTrade Support" <${smtpUser}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Email sending failed: ${error.message}`);
    throw error;
  }
};

module.exports = { sendEmail };
