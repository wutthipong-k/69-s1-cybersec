module.exports = ({ env }) => ({
  email: {
    config: {
      provider: 'sendmail',
      providerOptions: {
        devPort: env.int('SMTP_PORT', 1025),
        devHost: env('SMTP_HOST', 'mailhog'),
      },
      settings: {
        defaultFrom: env('SMTP_FROM', 'noreply@example.com'),
        defaultReplyTo: env('SMTP_FROM', 'noreply@example.com'),
      },
    },
  },
});