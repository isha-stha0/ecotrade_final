const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    let transporter;
    const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || '').trim();
    // Gmail displays app passwords with spaces, but SMTP authentication expects
    // the 16-character value without formatting spaces.
    const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').replace(/\s+/g, '');
    const isSmtpConfigured = smtpUser && smtpPass;

    if (isSmtpConfigured) {
      const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: smtpPort,
        secure: smtpPort === 465,
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
