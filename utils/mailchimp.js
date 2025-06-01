// mailchimp.js
const mailchimp = require("@mailchimp/mailchimp_marketing");
require("dotenv").config(); // Load environment variables if you haven't already

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
});

async function addContactToAudience(email, firstName = "", lastName = "") {
  try {
    const response = await mailchimp.lists.addListMember(
      process.env.MAILCHIMP_AUDIENCE_ID,
      {
        email_address: email,
        status: "subscribed", // Or 'pending' for double opt-in
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
        },
      }
    );
    console.log(`Successfully added contact: ${email}`, response);
    return response;
  } catch (error) {
    console.error("Error adding contact:", error);
    throw error;
  }
}

module.exports = {
  addContactToAudience,
};
