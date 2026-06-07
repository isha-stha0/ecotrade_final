const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    let transporter;
    const isSmtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;

    if (isSmtpConfigured) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
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
      from: process.env.EMAIL_FROM || '"EcoTrade Support" <noreply@ecotrade.com>',
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
    return { error: error.message };
  }
};

module.exports = { sendEmail };
