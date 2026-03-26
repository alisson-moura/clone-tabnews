import nodemailer from "nodemailer";

class Email {
  transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMT_HOST,
      port: process.env.EMAIL_SMT_PORT,
      auth: {
        user: process.env.EMAIL_SMT_USER,
        pass: process.env.EMAIL_SMT_PASSWORD,
      },
      secure: process.env.NODE_ENV === "production",
    });
  }

  async send({ to, subject, text, from }) {
    await this.transporter.sendMail({
      from: from ?? process.env.EMAIL_DEFAULT_FROM,
      to,
      subject,
      text,
    });
  }
}

const email = new Email();
export default email;
