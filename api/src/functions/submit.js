const { app } = require('@azure/functions');

// Simple helper to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

app.http('submit', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('Processing portfolio contact form submission.');

        try {
            // Read and parse request body
            let body;
            try {
                body = await request.json();
            } catch (err) {
                return {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                    jsonBody: { success: false, error: 'Invalid JSON request body' }
                };
            }

            const { name, email, subject, message, botcheck } = body;

            // 1. Honeypot Spam Protection (botcheck)
            // If the hidden botcheck field is filled out, we silently discard the message
            // but return a successful status code to trick the bot into thinking it succeeded.
            if (botcheck && botcheck.trim() !== '') {
                context.warn('Honeypot triggered! Bot submission caught and silently ignored.');
                return {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    jsonBody: { success: true, message: 'Message sent successfully.' }
                };
            }

            // 2. Server-side Validation
            if (!name || name.trim().length < 2) {
                return {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                    jsonBody: { success: false, error: 'Full Name must be at least 2 characters long.' }
                };
            }

            if (!email || !isValidEmail(email.trim())) {
                return {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                    jsonBody: { success: false, error: 'Please enter a valid email address.' }
                };
            }

            if (!subject || subject.trim().length < 3) {
                return {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                    jsonBody: { success: false, error: 'Subject must be at least 3 characters long.' }
                };
            }

            if (!message || message.trim().length < 10) {
                return {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                    jsonBody: { success: false, error: 'Message must be at least 10 characters long.' }
                };
            }

            // 3. Check for Web3Forms Access Key
            const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
            if (!accessKey) {
                context.error('WEB3FORMS_ACCESS_KEY is not defined in environment variables.');
                return {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                    jsonBody: { 
                        success: false, 
                        error: 'Form submission is currently misconfigured. Please check environment variables.' 
                    }
                };
            }

            // 4. Forward request securely to Web3Forms
            const web3FormsPayload = {
                access_key: accessKey,
                name: name.trim(),
                email: email.trim(),
                subject: `Portfolio Inquiry: ${subject.trim()}`,
                message: message.trim(),
                from_name: 'Nandan Sai Portfolio',
            };

            context.log('Forwarding secure contact message to Web3Forms API...');
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(web3FormsPayload)
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                context.error('Failed to submit message to Web3Forms:', result);
                return {
                    status: response.status || 500,
                    headers: { 'Content-Type': 'application/json' },
                    jsonBody: { 
                        success: false, 
                        error: result.message || 'An error occurred while forwarding the form submission.' 
                    }
                };
            }

            context.log('Form submission completed successfully.');
            return {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                jsonBody: { success: true, message: 'Your message has been sent successfully!' }
            };

        } catch (error) {
            context.error('Unhandled error during form submission handler:', error);
            return {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
                jsonBody: { success: false, error: 'A server error occurred. Please try again later.' }
            };
        }
    }
});
