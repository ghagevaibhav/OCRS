const nodemailer = require('nodemailer');
const { MailtrapTransport } = require("mailtrap");

// Create transporter - uses Mailtrap API if token is available, otherwise falls back to SMTP
const createTransporter = () => {
    const mailtrapToken = process.env.MAILTRAP_TOKEN;

    if (mailtrapToken) {
        // Use Mailtrap API transport (bypasses SMTP port blocking)
        console.log(`[${new Date().toISOString()}] Using Mailtrap API transport`);
        return nodemailer.createTransport(
            MailtrapTransport({
                token: mailtrapToken,
            })
        );
    } else {
        // Fallback to traditional SMTP
        console.log(`[${new Date().toISOString()}] Using SMTP transport`);
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'live.smtp.mailtrap.io',
            port: parseInt(process.env.SMTP_PORT) || 587,
            auth: {
                user: process.env.SMTP_USER || 'api',
                pass: process.env.SMTP_PASS
            }
        });
    }
};

// Verify transporter connection on startup
const verifyTransporter = async () => {
    try {
        const transporter = createTransporter();

        // For Mailtrap API, we can't verify in the traditional way
        if (process.env.MAILTRAP_TOKEN) {
            console.log(`[${new Date().toISOString()}] Mailtrap API transport initialized (token present)`);
            return true;
        }

        await transporter.verify();
        console.log(`[${new Date().toISOString()}] SMTP connection verified successfully`);
        return true;
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Transport verification failed:`, error.message);
        return false;
    }
};

// Call verification on module load (non-blocking)
verifyTransporter();

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

    // Missing Person Report Filed template
    missingPersonFiled: (data) => ({
        subject: `Missing Person Report Filed - ${data.caseNumber || 'OCRS'}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #059669, #047857); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">OCRS</h1>
                    <p style="color: #d1fae5; margin: 5px 0;">Online Crime Reporting System</p>
                </div>
                <div style="padding: 30px; background: #f8fafc;">
                    <h2 style="color: #047857;">Missing Person Report Filed Successfully</h2>
                    <p>Dear Citizen,</p>
                    <p>Your missing person report has been successfully filed and registered in our system. The authorities have been notified and will begin the search process.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
                        <h3 style="color: #047857; margin-top: 0;">Report Details</h3>
                        <p><strong>Case Number:</strong> <span style="color: #059669; font-weight: bold;">${data.caseNumber || 'N/A'}</span></p>
                        <p><strong>Status:</strong> ${data.status || 'Pending'}</p>
                        <p><strong>Filed At:</strong> ${formatTimestamp(data.timestamp)}</p>
                    </div>

                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                        <h3 style="color: #d97706; margin-top: 0;">Missing Person Information</h3>
                        <p><strong>Name:</strong> ${data.missingPersonName || 'N/A'}</p>
                        ${data.age ? `<p><strong>Age:</strong> ${data.age} years</p>` : ''}
                        ${data.gender ? `<p><strong>Gender:</strong> ${data.gender}</p>` : ''}
                        ${data.height ? `<p><strong>Height:</strong> ${data.height}</p>` : ''}
                        ${data.complexion ? `<p><strong>Complexion:</strong> ${data.complexion}</p>` : ''}
                    </div>

                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                        <h3 style="color: #dc2626; margin-top: 0;">Last Seen Details</h3>
                        <p><strong>Last Seen Date:</strong> ${data.lastSeenDate || 'N/A'}</p>
                        <p><strong>Last Seen Location:</strong> ${data.lastSeenLocation || 'N/A'}</p>
                        ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
                    </div>

                    <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Assigned Authority:</strong> ${data.authorityName || 'Pending Assignment'}</p>
                    </div>

                    <p>You can track the status of your report using the case number above.</p>
                    <p style="color: #64748b; font-size: 14px;">This is an automated message. Please do not reply.</p>
                </div>
                <div style="background: #1e293b; padding: 15px; text-align: center;">
                    <p style="color: #94a3b8; margin: 0; font-size: 12px;">© 2024 OCRS - Online Crime Reporting System</p>
                </div>
            </div>
        `
    }),


    // Missing Person Report Update template
    missingPersonUpdate: (data) => ({
        subject: `Missing Person Report Updated - ${data.caseNumber || 'OCRS'}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #059669, #047857); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">OCRS</h1>
                    <p style="color: #d1fae5; margin: 5px 0;">Online Crime Reporting System</p>
                </div>
                <div style="padding: 30px; background: #f8fafc;">
                    <h2 style="color: #047857;">Your Missing Person Report Has Been Updated</h2>
                    <p>Dear Citizen,</p>
                    <p>An authority has made an update to your missing person report.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
                        <h3 style="color: #047857; margin-top: 0;">Case Details</h3>
                        <p><strong>Case Number:</strong> <span style="color: #059669; font-weight: bold;">${data.caseNumber || 'N/A'}</span></p>
                        ${data.missingPersonName ? `<p><strong>Missing Person:</strong> ${data.missingPersonName}</p>` : ''}
                        <p><strong>Update Type:</strong> ${data.updateType || 'Status Update'}</p>
                    </div>

                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                        <h3 style="color: #d97706; margin-top: 0;">Status Change</h3>
                        ${data.previousStatus ? `<p><strong>Previous Status:</strong> <span style="color: #64748b;">${data.previousStatus}</span></p>` : ''}
                        ${data.newStatus ? `<p><strong>New Status:</strong> <span style="color: #059669; font-weight: bold;">${data.newStatus}</span></p>` : ''}
                        <p><strong>Updated At:</strong> ${formatTimestamp(data.timestamp)}</p>
                    </div>

                    ${data.comment ? `
                    <div style="background: #fefce8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #eab308;">
                        <p style="margin: 0;"><strong>Authority's Comment:</strong></p>
                        <p style="margin: 10px 0 0 0; color: #713f12;">${data.comment}</p>
                    </div>
                    ` : ''}

                    <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Updated By:</strong> ${data.authorityName || 'Assigned Authority'}</p>
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

    // Missing Person Report Reassigned template
    missingPersonReassigned: (data) => ({
        subject: `Missing Person Report Reassigned - ${data.caseNumber || 'OCRS'}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #7c3aed, #5b21b6); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">OCRS</h1>
                    <p style="color: #ddd6fe; margin: 5px 0;">Online Crime Reporting System</p>
                </div>
                <div style="padding: 30px; background: #f8fafc;">
                    <h2 style="color: #5b21b6;">Your Missing Person Report Has Been Reassigned</h2>
                    <p>Dear Citizen,</p>
                    <p>Your missing person report has been reassigned to a different authority officer to ensure the best possible handling of your case.</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
                        <h3 style="color: #5b21b6; margin-top: 0;">Case Details</h3>
                        <p><strong>Case Number:</strong> <span style="color: #7c3aed; font-weight: bold;">${data.caseNumber || 'N/A'}</span></p>
                        ${data.missingPersonName ? `<p><strong>Missing Person:</strong> ${data.missingPersonName}</p>` : ''}
                        <p><strong>Current Status:</strong> ${data.status || 'Under Investigation'}</p>
                    </div>

                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
                        <h3 style="color: #047857; margin-top: 0;">New Assignment</h3>
                        <p><strong>New Assigned Authority:</strong> <span style="color: #059669; font-weight: bold;">${data.newAuthorityName || 'N/A'}</span></p>
                        ${data.previousAuthorityName ? `<p><strong>Previous Authority:</strong> <span style="color: #64748b;">${data.previousAuthorityName}</span></p>` : ''}
                        <p><strong>Reassigned At:</strong> ${formatTimestamp(data.timestamp)}</p>
                    </div>

                    <div style="background: #faf5ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #5b21b6;"><strong>Note:</strong> This reassignment is to ensure efficient handling of your case. The new authority will continue the investigation without any delays.</p>
                    </div>

                    <p>Log in to your dashboard to view the complete case details and contact information for the new authority.</p>
                    <p style="color: #64748b; font-size: 14px;">This is an automated message. Please do not reply.</p>
                </div>
                <div style="background: #1e293b; padding: 15px; text-align: center;">
                    <p style="color: #94a3b8; margin: 0; font-size: 12px;">© 2024 OCRS - Online Crime Reporting System</p>
                </div>
            </div>
        `
    }),

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
                    <p>An authority has made an update to your FIR.</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                        <p><strong>FIR Number:</strong> ${data.firNumber || data.reference || 'N/A'}</p>
                        <p><strong>Update Type:</strong> ${data.updateType || 'Status Update'}</p>
                        ${data.newStatus ? `<p><strong>New Status:</strong> <span style="color: #059669; font-weight: bold;">${data.newStatus}</span></p>` : ''}
                        ${data.previousStatus ? `<p><strong>Previous Status:</strong> ${data.previousStatus}</p>` : ''}
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;">
                        <p><strong>Updated By:</strong> ${data.authorityName || 'Assigned Authority'}</p>
                        <p><strong>Updated At:</strong> ${formatTimestamp(data.timestamp)}</p>
                        ${data.comment ? `<div style="background: #f1f5f9; padding: 10px; border-radius: 4px; margin-top: 10px;"><strong>Comment:</strong><br/>${data.comment}</div>` : ''}
                    </div>
                    <p>Log in to your dashboard to view the complete case details.</p>
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

        const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@ghagevaibhav.xyz';
        const fromName = process.env.SMTP_FROM_NAME || 'OCRS System';

        const mailOptions = {
            from: {
                address: fromEmail,
                name: fromName
            },
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
    failedEmailQueue.length = 0;

    for (const item of itemsToProcess) {
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
