// api/utils/sendEmail.js
import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  console.log('Attempting to send email to:', options.email);
  
  // Gmail-specific configuration
  const transporter = nodemailer.createTransport({
    service: 'gmail',  // Use 'gmail' service instead of custom host/port
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  const message = {
    from: `"${process.env.FROM_NAME}" <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Detailed email sending error:', error);
    throw error;
  }
};

export default sendEmail;