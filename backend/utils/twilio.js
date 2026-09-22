// backend/utils/twilio.js
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
// --- THIS IS THE CRITICAL CHANGE ---
// We now use the Verify Service SID, which matches your .env file
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

// Function to START the verification process (sends the OTP)
export const startVerification = async (toPhoneNumber) => {
  // Defensive check to ensure all necessary credentials are loaded
  if (!accountSid || !authToken || !verifyServiceSid) {
    console.error("Twilio credentials (Account SID, Auth Token, and Verify Service SID) are not fully configured.");
    return { success: false, error: new Error("Twilio configuration is incomplete.") };
  }

  try {
    const verification = await client.verify.v2.services(verifyServiceSid)
      .verifications
      .create({ to: toPhoneNumber, channel: 'sms' });
    
    console.log(`Twilio verification started for ${toPhoneNumber}. Status: ${verification.status}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to start Twilio verification:", error);
    return { success: false, error };
  }
};

// Function to CHECK the verification code (verifies the OTP)
export const checkVerification = async (toPhoneNumber, otpCode) => {
  if (!verifyServiceSid) {
    console.error("Twilio Verify Service SID is not configured.");
    return { success: false, error: new Error("Twilio configuration is incomplete.") };
  }
  try {
    const verificationCheck = await client.verify.v2.services(verifyServiceSid)
      .verificationChecks
      .create({ to: toPhoneNumber, code: otpCode });

    // The check is successful if Twilio returns a status of 'approved'
    return { success: verificationCheck.status === 'approved' };
  } catch (error) {
    console.error("Failed to check Twilio verification:", error);
    // If Twilio returns a 404 error, it means the code was incorrect.
    // For any other error, we pass it along.
    return { success: false, error };
  }
};