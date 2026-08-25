const mailSender = async (email, title, body) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    throw new Error(
      "Email service is not configured: missing BREVO_API_KEY or BREVO_SENDER_EMAIL"
    );
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: "MindBridge", email: senderEmail },
      to: [{ email }],
      subject: title,
      htmlContent: body,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    // Throwing here (instead of swallowing) means callers' existing
    // try/catch blocks correctly report success: false when email fails.
    throw new Error(`Brevo API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  console.log("Email sent via Brevo, messageId:", data.messageId);
  return data;
};

module.exports = mailSender;