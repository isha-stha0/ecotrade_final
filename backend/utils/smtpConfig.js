function getSmtpConfig() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);

  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number.isNaN(port) ? 587 : port,
    secure: port === 465,
    user,
    pass,
  };
}

module.exports = { getSmtpConfig };
