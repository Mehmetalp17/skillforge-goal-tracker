import Mailgun from 'mailgun.js';
import FormData from 'form-data';

const sendEmail = async (options) => {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
        username: 'api',
        key: process.env.MAILGUN_API_KEY,
    });

    await mg.messages.create(process.env.MAILGUN_DOMAIN, {
        from: `${process.env.FROM_NAME} <postmaster@${process.env.MAILGUN_DOMAIN}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    }).catch(err => {
        console.error('Mailgun error status:', err.status);
        console.error('Mailgun error details:', JSON.stringify(err.details || err.message));
        throw err;
    });
};

export default sendEmail;
