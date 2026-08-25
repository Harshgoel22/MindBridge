const axios = require("axios");

const mailSender = async (email, title, body) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    throw new Error(
      "Email service is not configured: missing BREVO_API_KEY or BREVO_SENDER_EMAIL"
    );
  }

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "MindBridge", email: senderEmail },
        to: [{ email }],
        subject: title,
        htmlContent: body,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "api-key": apiKey,
        },
      }
    );

    console.log("Email sent via Brevo, messageId:", response.data.messageId);
    return response.data;
  } catch (error) {
    // Throwing here (instead of swallowing) means callers' existing
    // try/catch blocks correctly report success: false when email fails.
    const details = error.response
      ? `${error.response.status}: ${JSON.stringify(error.response.data)}`
      : error.message;
    throw new Error(`Brevo API error - ${details}`);
  }
};

module.exports = mailSender;