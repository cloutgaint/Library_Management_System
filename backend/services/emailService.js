const nodemailer = require("nodemailer");

// EMAIL_TRANSPORT=memory keeps messages in `outbox` instead of sending them (tests only).
const useMemoryTransport = process.env.EMAIL_TRANSPORT === "memory";
const outbox = [];

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = useMemoryTransport
      ? nodemailer.createTransport({ jsonTransport: true })
      : nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });
  }

  return transporter;
};

const isEmailConfigured = () =>
  useMemoryTransport || Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);

const sendEmail = async (to, subject, text) => {
  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_USER || "lms@localhost",
      to,
      subject,
      text,
    });

    if (useMemoryTransport) {
      outbox.push({ to, subject, text });
    }

    return info;
  } catch (error) {
    // Only the message is logged: the error object can contain SMTP credentials.
    console.error("Email sending failed:", error.message);
    throw error;
  }
};

module.exports = {
  sendEmail,
  isEmailConfigured,
  outbox,
};
