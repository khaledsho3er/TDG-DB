// mailchimp.js
const mailchimp = require("@mailchimp/mailchimp_marketing");

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY, // 👈 from your Mailchimp account
  server: process.env.MAILCHIMP_SERVER_PREFIX, // 👈 replace with your real server prefix (e.g. us21, us6)
});

module.exports = mailchimp;
