// utils/awsSes.js
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const sesClient = new SESClient({
  region: "us-east-2", // 🔁 use your verified SES region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
console.log("SES ENV:", {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.slice(0, 5) + "****",
});

/**
 * Send an email using AWS SES
 * @param {Object} options
 * @param {string} options.to - Receiver's email
 * @param {string} options.subject - Subject line
 * @param {string} options.body - Email body in HTML format
 */
const sendEmail = async ({ to, subject, body }) => {
  const params = {
    Source: "noreply@thedesigngrit.com", // ✅ must match a verified domain/email in SES
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: { Data: subject },
      Body: {
        Html: { Data: body },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    console.log("✅ Email sent via SES:", result.MessageId);
    return result;
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    throw error;
  }
};

module.exports = { sendEmail };
