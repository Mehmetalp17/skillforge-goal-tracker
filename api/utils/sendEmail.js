import Mailgun from 'mailgun.js';
import FormData from 'form-data';

const sendEmail = async (options) => {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;

    console.log('[sendEmail] Starting email send');
    console.log('[sendEmail] MAILGUN_DOMAIN:', domain || 'NOT SET');
    console.log('[sendEmail] MAILGUN_API_KEY:', apiKey ? `set (${apiKey.substring(0, 8)}...)` : 'NOT SET');
    console.log('[sendEmail] To:', options.email);
    console.log('[sendEmail] Subject:', options.subject);

    if (!apiKey || !domain) {
        throw new Error(`Mailgun config missing — API_KEY: ${!!apiKey}, DOMAIN: ${!!domain}`);
    }

    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: 'api', key: apiKey });

    const payload = {
        from: `${process.env.FROM_NAME || 'SkillForge'} <postmaster@${domain}>`,
        to: [options.email],
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    console.log('[sendEmail] Sending via Mailgun with from:', payload.from);

    try {
        const result = await mg.messages.create(domain, payload);
        console.log('[sendEmail] Success:', result.id, result.message);
        return result;
    } catch (err) {
        console.error('[sendEmail] FAILED');
        console.error('[sendEmail] Status:', err.status);
        console.error('[sendEmail] Message:', err.message);
        console.error('[sendEmail] Details:', JSON.stringify(err.details ?? err.response?.data ?? 'no details'));
        throw err;
    }
};

export default sendEmail;
