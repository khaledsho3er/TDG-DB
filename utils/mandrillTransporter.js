const mandrill = require("@mailchimp/mailchimp_transactional");

// Initialize Mandrill client
const mandrillClient = mandrill(process.env.MANDRILL_API_KEY);

// Email templates
const emailTemplates = {
  orderReceipt: {
    subject: "Thank you for your order!",
    template: "order-receipt-template", // You'll need to create this template in Mandrill
  },
  orderConfirmation: {
    subject: "Your order has been confirmed",
    template: "order-thanks", // You'll need to create this template in Mandrill
  },
};

// Function to send email using Mandrill
const sendMandrillEmail = async (to, templateName, templateContent) => {
  try {
    const message = {
      to: [{ email: to }],
      subject: emailTemplates[templateName].subject,
      template_name: emailTemplates[templateName].template,
      template_content: templateContent,
    };

    const result = await mandrillClient.messages.sendTemplate({
      template_name: emailTemplates[templateName].template,
      template_content: templateContent,
      message: message,
    });

    return result;
  } catch (error) {
    console.error("Mandrill email sending failed:", error);
    throw error;
  }
};

module.exports = {
  sendMandrillEmail,
  emailTemplates,
};
