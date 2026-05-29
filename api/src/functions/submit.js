const { app } = require('@azure/functions');
const https = require('https');

// Web3Forms access key (server-side only — never sent to browser)
const WEB3FORMS_ACCESS_KEY = process.env.WEB3FORMS_ACCESS_KEY || '66be9524-4d26-4626-9db0-448da331fe89';

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// HTTPS POST helper (avoids native fetch compatibility issues)
function httpsPost(url, data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const urlObj = new URL(url);

        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    reject(new Error('Failed to parse response: ' + body));
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

app.http('submit', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Processing portfolio contact form submission.');

        try {
            // Parse request body
            let body;
            try {
                body = await request.json();
            } catch (err) {
                return {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                    jsonBody: { success: false, error: 'Invalid request body.' }
                };
            }

            const { name, email, subject, message, botcheck } = body;

            // 1. Honeypot — silently discard bot submissions
            if (botcheck && botcheck.trim() !== '') {
                context.warn('Honeypot triggered — bot submission discarded.');
                return {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    jsonBody: { success: true, message: 'Message sent successfully.' }
                };
            }

            // 2. Server-side validation
            if (!name || name.trim().length < 2) {
                return { status: 400, headers: { 'Content-Type': 'application/json' }, jsonBody: { success: false, error: 'Full Name must be at least 2 characters long.' } };
            }
            if (!email || !isValidEmail(email.trim())) {
                return { status: 400, headers: { 'Content-Type': 'application/json' }, jsonBody: { success: false, error: 'Please enter a valid email address.' } };
            }
            if (!subject || subject.trim().length < 3) {
                return { status: 400, headers: { 'Content-Type': 'application/json' }, jsonBody: { success: false, error: 'Subject must be at least 3 characters long.' } };
            }
            if (!message || message.trim().length < 10) {
                return { status: 400, headers: { 'Content-Type': 'application/json' }, jsonBody: { success: false, error: 'Message must be at least 10 characters long.' } };
            }

            // 3. Forward to Web3Forms via Node.js https module
            const payload = {
                access_key: WEB3FORMS_ACCESS_KEY,
                name: name.trim(),
                email: email.trim(),
                subject: `Portfolio Inquiry: ${subject.trim()}`,
                message: message.trim(),
                from_name: 'Nandan Sai Portfolio'
            };

            context.log('Forwarding to Web3Forms...');
            const result = await httpsPost('https://api.web3forms.com/submit', payload);

            if (result.status !== 200 || !result.data.success) {
                context.error('Web3Forms error:', result.data);
                return {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                    jsonBody: { success: false, error: result.data.message || 'Failed to send message. Please try again.' }
                };
            }

            context.log('Form submitted successfully.');
            return {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                jsonBody: { success: true, message: 'Your message has been sent successfully!' }
            };

        } catch (error) {
            context.error('Unhandled error:', error.message);
            return {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
                jsonBody: { success: false, error: 'A server error occurred. Please try again later.' }
            };
        }
    }
});
