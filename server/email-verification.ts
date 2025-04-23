import { MailService } from '@sendgrid/mail';
import { storage } from './storage';
import crypto from 'crypto';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set. Email verification will not work.");
}

// Initialize SendGrid if API key is available
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// In-memory store for verification codes (in production would use Redis or similar)
// Format: { email: { code: string, expires: Date } }
const verificationCodes: Record<string, { code: string, expires: Date }> = {};

// Generate and store a verification code
export async function generateVerificationCode(email: string): Promise<string> {
  // Generate a random 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  
  // Set expiration to 30 minutes from now
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 30);
  
  // Store the code
  verificationCodes[email] = { code, expires };
  
  return code;
}

// Verify a code
export function verifyCode(email: string, code: string): boolean {
  const storedData = verificationCodes[email];
  
  // Check if code exists and hasn't expired
  if (storedData && storedData.code === code && storedData.expires > new Date()) {
    // Remove the code after successful verification
    delete verificationCodes[email];
    return true;
  }
  
  return false;
}

// Send verification email
export async function sendVerificationEmail(email: string, username: string): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error("Cannot send verification email: SENDGRID_API_KEY not set");
    return false;
  }
  
  try {
    const code = await generateVerificationCode(email);
    
    await mailService.send({
      to: email,
      from: process.env.EMAIL_FROM || 'no-reply@fourbyte.com', // Update with your domain
      subject: 'Verify your FourByte account',
      text: `Hello ${username},\n\nYour verification code is: ${code}\n\nThis code will expire in 30 minutes.\n\nThank you,\nThe FourByte Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0052CC;">Verify your FourByte account</h2>
          <p>Hello ${username},</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f5f5f5; padding: 15px; font-size: 24px; text-align: center; letter-spacing: 5px; font-weight: bold;">
            ${code}
          </div>
          <p>This code will expire in 30 minutes.</p>
          <p>Thank you,<br>The FourByte Team</p>
        </div>
      `,
    });
    
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

// Resend verification code
export async function resendVerificationCode(email: string): Promise<boolean> {
  try {
    // Look up the user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return false;
    }
    
    // Send a new verification email
    return await sendVerificationEmail(email, user.username);
  } catch (error) {
    console.error('Error resending verification code:', error);
    return false;
  }
}