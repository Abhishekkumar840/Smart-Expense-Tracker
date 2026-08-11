// Email sending helpers.
const nodemailer = require('nodemailer');
const config = require('../config/env.config');
const logger = require('../config/logger.config');

class EmailService {
  #transporter;

  constructor() {
    this.#transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.port === 465, // true for port 465, false for 587/others (STARTTLS)
      auth: {
        user: config.mail.user,
        pass: config.mail.pass,
      },
    });
  }

  async #send({ to, subject, html }) {
    try {
      await this.#transporter.sendMail({
        from: config.mail.from,
        to,
        subject,
        html,
      });
      logger.info(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      // Emails failing to send should not crash the request that triggered
      // them (e.g. signup should still succeed even if the verification
      // email bounces) — we log loudly instead of throwing, and let the
      // caller decide whether that failure matters for its own flow.
      logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendVerificationEmail(user, rawToken) {
    const verifyUrl = `${config.clientUrl}/verify-email?token=${rawToken}`;
    await this.#send({
      to: user.email,
      subject: 'Verify your Smart Expense Tracker account',
      html: `
        <p>Hi ${user.name},</p>
        <p>Please verify your email address to activate your account.</p>
        <p><a href="${verifyUrl}">Verify my email</a></p>
        <p>This link expires in 24 hours.</p>
      `,
    });
  }

  async sendPasswordResetEmail(user, rawToken) {
    const resetUrl = `${config.clientUrl}/reset-password?token=${rawToken}`;
    await this.#send({
      to: user.email,
      subject: 'Reset your Smart Expense Tracker password',
      html: `
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your password.</p>
        <p><a href="${resetUrl}">Reset my password</a></p>
        <p>This link expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
      `,
    });
  }

  async sendBudgetAlertEmail(user, budgetName, percentageUsed) {
    await this.#send({
      to: user.email,
      subject: `Budget alert: ${budgetName}`,
      html: `
        <p>Hi ${user.name},</p>
        <p>You've used ${percentageUsed}% of your "${budgetName}" budget.</p>
      `,
    });
  }
}

module.exports = EmailService;
