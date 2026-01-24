const nodemailer = require('nodemailer');

// Create transporter with Mailtrap configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
        port: parseInt(process.env.MAILTRAP_PORT) || 2525,
        auth: {
            user: process.env.MAILTRAP_USER || 'your_mailtrap_user',
            pass: process.env.MAILTRAP_PASS || 'your_mailtrap_password'
        }
    });
};

// Retry queue for failed emails
const failedEmailQueue = [];
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

// Format timestamp for display
const formatTimestamp = (timestamp) => {
    if (!timestamp) return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
};

// Email templates
const templates = {
    firFiled: (data) => ({
        subject: 'FIR Filed Successfully - OCRS',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #2563eb, #1e40af); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">OCRS</h1>
                    <p style="color: #e0e7ff; margin: 5px 0;">Online Crime Reporting System</p>
                </div>
                <div style="padding: 30px; background: #f8fafc;">
                    <h2 style="color: #1e40af;">FIR Filed Successfully</h2>
                    <p>Dear Citizen,</p>
                    <p>Your FIR has been successfully filed and registered in our system.</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>FIR Number:</strong> ${data.firNumber || data.reference || 'N/A'}</p>
                        <p><strong>Status:</strong> Assigned to Authority</p>
                        <p><strong>Assigned Officer:</strong> ${data.authorityName || 'Pending Assignment'}</p>
                        <p><strong>Filed At:</strong> ${formatTimestamp(data.timestamp)}</p>
                    </div>
                    <p>You can track the status of your FIR using the reference number above.</p>
                    <p style="color: #64748b; font-size: 14px;">This is an automated message. Please do not reply.</p>
                </div>
                <div style="background: #1e293b; padding: 15px; text-align: center;">
                    <p style="color: #94a3b8; margin: 0; font-size: 12px;">© 2024 OCRS - Online Crime Reporting System</p>
                </div>
            </div>
        `
    }),

    // New template for FIR/Case updates with detailed information
    firUpdate: (data) => ({
        subject: `FIR Update - ${data.firNumber || data.reference || 'OCRS'}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #2563eb, #1e40af); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">OCRS</h1>
                    <p style="color: #e0e7ff; margin: 5px 0;">Online Crime Reporting System</p>
                </div>
                <div style="padding: 30px; background: #f8fafc;">
                    <h2 style="color: #1e40af;">Your FIR Has Been Updated</h2>
                    <p>Dear Citizen,</p>
                    <p>An authority has made an update to your FIR. Please find the details below:</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                        <p><strong>FIR Number:</strong> ${data.firNumber || data.reference || 'N/A'}</p>
                        <p><strong>Update Type:</strong> ${data.updateType || 'Status Update'}</p>
                        ${data.newStatus ? `<p><strong>New Status:</strong> <span style="color: #059669; font-weight: bold;">${data.newStatus}</span></p>` : ''}
                        ${data.previousStatus ? `<p><strong>Previous Status:</strong> ${data.previousStatus}</p>` : ''}
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;">
                        <p><strong>Updated By:</strong> ${data.authorityName || 'Assigned Authority'}</p>
                        ${data.authorityId ? `<p><strong>Authority ID:</strong> ${data.authorityId}</p>` : ''}
                        <p><strong>Updated At:</strong> ${formatTimestamp(data.timestamp)}</p>
                        ${data.comment ? `<div style="background: #f1f5f9; padding: 10px; border-radius: 4px; margin-top: 10px;"><strong>Comment:</strong><br/>${data.comment}</div>` : ''}
                    </div>
                    <p>Log in to your dashboard to view the complete case details and history.</p>
                    <p style="color: #64748b; font-size: 14px;">This is an automated message. Please do not reply.</p>
                </div>
                <div style="background: #1e293b; padding: 15px; text-align: center;">
                    <p style="color: #94a3b8; margin: 0; font-size: 12px;">© 2024 OCRS - Online Crime Reporting System</p>
                </div>
            </div>
        `
    }),

    statusUpdate: (data) => ({
        subject: `Case Status Updated - ${data.reference || 'OCRS'}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #2563eb, #1e40af); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">OCRS</h1>
                    <p style="color: #e0e7ff; margin: 5px 0;">Online Crime Reporting System</p>
                </div>
                <div style="padding: 30px; background: #f8fafc;">
                    <h2 style="color: #1e40af;">Case Status Updated</h2>
                    <p>Dear Citizen,</p>
                    <p>There has been an update on your case.</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Case Number:</strong> ${data.reference || 'N/A'}</p>
                        <p><strong>New Status:</strong> ${data.newStatus || 'Updated'}</p>
                        ${data.authorityName ? `<p><strong>Updated By:</strong> ${data.authorityName}</p>` : ''}
                        <p><strong>Updated At:</strong> ${formatTimestamp(data.timestamp)}</p>
                        ${data.comment ? `<p><strong>Comment:</strong> ${data.comment}</p>` : ''}
                    </div>
                    <p>Log in to your dashboard to view the full details.</p>
                    <p style="color: #64748b; font-size: 14px;">This is an automated message. Please do not reply.</p>
                </div>
                <div style="background: #1e293b; padding: 15px; text-align: center;">
                    <p style="color: #94a3b8; margin: 0; font-size: 12px;">© 2024 OCRS - Online Crime Reporting System</p>
                </div>
            </div>
        `
    }),

    generic: (data) => ({
        subject: data.subject || 'Notification from OCRS',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #2563eb, #1e40af); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">OCRS</h1>
                    <p style="color: #e0e7ff; margin: 5px 0;">Online Crime Reporting System</p>
                </div>
                <div style="padding: 30px; background: #f8fafc;">
                    <h2 style="color: #1e40af;">${data.subject || 'Notification'}</h2>
                    <p>${data.message || ''}</p>
                    <p style="color: #64748b; font-size: 14px;">This is an automated message. Please do not reply.</p>
                </div>
                <div style="background: #1e293b; padding: 15px; text-align: center;">
                    <p style="color: #94a3b8; margin: 0; font-size: 12px;">© 2024 OCRS - Online Crime Reporting System</p>
                </div>
            </div>
        `
    })
};

// Send email function with retry support
const sendEmail = async (to, templateName, data, retryCount = 0) => {
    try {
        const transporter = createTransporter();
        const template = templates[templateName] ? templates[templateName](data) : templates.generic(data);

        const mailOptions = {
            from: `"${process.env.FROM_NAME || 'OCRS System'}" <${process.env.FROM_EMAIL || 'noreply@ocrs.gov.in'}>`,
            to: to,
            subject: template.subject,
            html: template.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[${new Date().toISOString()}] Email sent successfully: ${info.messageId} to ${to}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Email error (attempt ${retryCount + 1}):`, error.message);

        // Add to retry queue if under max attempts
        if (retryCount < MAX_RETRY_ATTEMPTS) {
            const queueItem = { to, templateName, data, retryCount: retryCount + 1, addedAt: Date.now() };
            failedEmailQueue.push(queueItem);
            console.log(`[${new Date().toISOString()}] Email queued for retry (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS}): ${to}`);
        } else {
            console.error(`[${new Date().toISOString()}] Email failed after ${MAX_RETRY_ATTEMPTS} attempts: ${to}`);
        }

        return { success: false, error: error.message, queued: retryCount < MAX_RETRY_ATTEMPTS };
    }
};

// Process retry queue periodically
const processRetryQueue = async () => {
    if (failedEmailQueue.length === 0) return;

    console.log(`[${new Date().toISOString()}] Processing retry queue: ${failedEmailQueue.length} emails`);

    const itemsToProcess = [...failedEmailQueue];
    failedEmailQueue.length = 0; // Clear the queue

    for (const item of itemsToProcess) {
        // Check if enough time has passed
        if (Date.now() - item.addedAt >= RETRY_DELAY_MS) {
            await sendEmail(item.to, item.templateName, item.data, item.retryCount);
        } else {
            // Put back in queue if not enough time passed
            failedEmailQueue.push(item);
        }
    }
};

// Start retry queue processor (runs every 10 seconds)
setInterval(processRetryQueue, 10000);

// Get queue status
const getQueueStatus = () => ({
    queueLength: failedEmailQueue.length,
    items: failedEmailQueue.map(item => ({
        to: item.to,
        template: item.templateName,
        retryCount: item.retryCount,
        addedAt: new Date(item.addedAt).toISOString()
    }))
});

module.exports = { sendEmail, templates, getQueueStatus };
