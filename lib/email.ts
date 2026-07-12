export async function sendOTP(email: string, otp: string) {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const BREVO_SENDER = process.env.BREVO_SENDER_EMAIL || "noreply@transitops.in";

  if (!BREVO_API_KEY) {
    console.warn("⚠️ BREVO_API_KEY not found. Skipping actual email send.");
    console.log(`[SIMULATED EMAIL to ${email}]: Your OTP is ${otp}`);
    return true; // Simulate success for local testing without key
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { email: BREVO_SENDER, name: "TransitOps Security" },
      to: [{ email: email }],
      subject: "Your TransitOps Verification Code",
      htmlContent: `
        <div style="font-family: sans-serif; max-w-md; margin: 0 auto; padding: 20px;">
          <h2 style="color: #111827;">Verify your email</h2>
          <p style="color: #4b5563; font-size: 16px;">Here is your secure verification code for TransitOps. It expires in 10 minutes.</p>
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ef4444;">${otp}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Brevo Email Error:", errorData);
    throw new Error("Failed to send OTP email");
  }

  return true;
}
