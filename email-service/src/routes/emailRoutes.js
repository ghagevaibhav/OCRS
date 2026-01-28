const express = require('express');
const router = express.Router();
const { sendEmail, getQueueStatus } = require('../services/emailService');

// Notification endpoint - called by backend services
router.post('/notify', async (req, res) => {
        try {
                const {
                        userId,
                        email,
                        subject,
                        message,
                        template,
                        // FIR update specific fields
                        firNumber,
                        reference,
                        updateType,
                        newStatus,
                        previousStatus,
                        authorityId,
                        authorityName,
                        comment,
                        timestamp,
                        // Missing Person specific fields
                        caseNumber,
                        missingPersonName,
                        age,
                        gender,
                        height,
                        complexion,
                        lastSeenDate,
                        lastSeenLocation,
                        description,
                        status,
                        // Missing Person Reassign specific fields
                        newAuthorityId,
                        newAuthorityName,
                        previousAuthorityId,
                        previousAuthorityName
                } = req.body;

                // In a real app, you would look up the user's email from userId
                // For now, we'll use a placeholder or the provided email
                const recipientEmail = email || `user${userId}@example.com`;

                // Determine the appropriate template
                let templateName = template || 'generic';

                if (!template) {
                        // Auto-detect template based on subject, content, or case number prefix
                        const caseRef = caseNumber || reference;

                        if (caseRef?.startsWith('MP-') || subject?.includes('Missing Person')) {
                                templateName = 'missingPersonFiled';
                        } else if (subject?.includes('FIR Filed') || caseRef?.startsWith('FIR-')) {
                                templateName = 'firFiled';
                        } else if (subject?.includes('Updated') || subject?.includes('Status Updated')) {
                                // Use firUpdate template for FIR-related updates with detailed info
                                if (firNumber || caseRef?.startsWith('FIR-')) {
                                        templateName = 'firUpdate';
                                } else {
                                        templateName = 'statusUpdate';
                                }
                        }
                }

                console.log(`[${new Date().toISOString()}] Processing email: template=${templateName}, to=${recipientEmail}, caseNumber=${caseNumber}`);

                const result = await sendEmail(recipientEmail, templateName, {
                        subject,
                        message,
                        firNumber: firNumber || reference,
                        reference,
                        updateType,
                        newStatus,
                        previousStatus,
                        authorityId,
                        authorityName,
                        comment,
                        timestamp: timestamp || Date.now(),
                        // Missing person fields
                        caseNumber: caseNumber || reference,
                        missingPersonName,
                        age,
                        gender,
                        height,
                        complexion,
                        lastSeenDate,
                        lastSeenLocation,
                        description,
                        status,
                        // Missing person reassign fields
                        newAuthorityId,
                        newAuthorityName,
                        previousAuthorityId,
                        previousAuthorityName
                });


                if (result.success) {
                        res.json({
                                success: true,
                                message: 'Email notification sent',
                                messageId: result.messageId,
                                template: templateName
                        });
                } else {
                        // If queued for retry, return 202 Accepted
                        if (result.queued) {
                                res.status(202).json({
                                        success: true,
                                        message: 'Email queued for retry',
                                        queued: true
                                });
                        } else {
                                res.status(500).json({
                                        success: false,
                                        message: 'Failed to send email',
                                        error: result.error
                                });
                        }
                }
        } catch (error) {
                console.error('Notify error:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
        }
});

// Send email directly with template
router.post('/send', async (req, res) => {
        try {
                const { to, template, data } = req.body;

                if (!to) {
                        return res.status(400).json({ success: false, message: 'Recipient email is required' });
                }

                const result = await sendEmail(to, template || 'generic', data || {});

                if (result.success) {
                        res.json({ success: true, message: 'Email sent', messageId: result.messageId });
                } else {
                        if (result.queued) {
                                res.status(202).json({ success: true, message: 'Email queued for retry', queued: true });
                        } else {
                                res.status(500).json({ success: false, message: 'Failed to send email', error: result.error });
                        }
                }
        } catch (error) {
                console.error('Send error:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
        }
});

// Queue status endpoint for monitoring
router.get('/queue/status', (req, res) => {
        const status = getQueueStatus();
        res.json({
                success: true,
                ...status
        });
});

module.exports = router;
