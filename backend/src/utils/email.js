const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || 'noreply@recipeplatform.com',
            to,
            subject,
            html,
            text
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Failed to send email');
    }
};

const sendPasswordResetEmail = async (email, resetToken, username) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f8f9fa; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .button { 
                    display: inline-block; 
                    padding: 12px 24px; 
                    background: #4CAF50; 
                    color: white !important; 
                    text-decoration: none; 
                    border-radius: 4px;
                    margin: 20px 0;
                }
                .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Reset Your Password</h1>
                </div>
                <div class="content">
                    <p>Hello ${username},</p>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <div style="text-align: center;">
                        <a href="${resetUrl}" class="button">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p><a href="${resetUrl}">${resetUrl}</a></p>
                    <p>This link will expire in 30 minutes.</p>
                    <p>If you didn't request a password reset, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Recipe Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const text = `
        Reset Your Password
        
        Hello ${username},
        
        We received a request to reset your password. Click the link below to create a new password:
        
        ${resetUrl}
        
        This link will expire in 30 minutes.
        
        If you didn't request a password reset, please ignore this email.
        
        © ${new Date().getFullYear()} Recipe Platform. All rights reserved.
    `;

    return sendEmail({
        to: email,
        subject: 'Reset Your Password - Recipe Platform',
        html,
        text
    });
};

module.exports = {
    sendEmail,
    sendPasswordResetEmail
};