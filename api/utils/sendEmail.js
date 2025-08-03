import sgMail from '@sendgrid/mail';

const sendEmail = async (options) => {
  // Set SendGrid API key
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  // Create message object
  const message = {
    to: options.email,
    from: process.env.FROM_EMAIL, // Verified sender in SendGrid
    subject: options.subject,
    text: options.message,
    html: options.html || options.message.replace(/\n/g, '<br>'),
  };
  
  // Send email
  await sgMail.send(message);
};

export default sendEmail;