export default () => ({
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      name: process.env.SMTP_NAME || '',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    defaultFrom: process.env.EMAIL_DEFAULT_FROM || '',
  },
});
