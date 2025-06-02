// mailchimp.js
const mailchimp = require("@mailchimp/mailchimp_marketing");
require("dotenv").config(); // Load environment variables if you haven't already
const listId = process.env.MAILCHIMP_AUDIENCE_ID; // Assuming you have a list ID in your environment variables

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
async function addOrderToMailchimp(email, order) {
  const subscriberHash = getSubscriberHash(email);

  const mergeFields = {
    ORDERID: order._id || "",
    ORDER_DATE: order.createdAt
      ? new Date(order.createdAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    ORDER_TOTAL: order.total?.toFixed(2) || "0.00",
    ORDER_SUBTOTAL: order.subtotal?.toFixed(2) || "0.00",
    ORDER_SHIP_TOTAL: order.shippingFee?.toFixed(2) || "0.00",
    ORDER_TAX_TOTAL: order.cartItems
      ? order.cartItems
          .reduce((sum, item) => sum + (item.taxAmount || 0), 0)
          .toFixed(2)
      : "0.00",
    SHIPPING_ADDRESS: formatShippingAddress(order.shippingDetails),
    ORDER_ITEMS: formatOrderItems(order.cartItems),
    ORDER_CONFIRM_TEST: "true", // <-- Add this merge field if your journey triggers on this
  };
  const tags = ["order-confirm-test"]; // Add tag that triggers the journey if that's your trigger method

  try {
    await mailchimp.lists.setListMember(listId, subscriberHash, {
      email_address: email,
      status_if_new: "subscribed",
      merge_fields: mergeFields,
      tags: tags,
    });
    await mailchimp.lists.updateListMemberTags(
      process.env.MAILCHIMP_AUDIENCE_ID,
      subscriberHash,
      {
        tags: [{ name: "order-confirm-test", status: "active" }],
      }
    );
    console.log(`✅ Order ${order._id} synced and tag added for journey`);
    console.log(`✅ Order ${order._id} synced with Mailchimp for ${email}`);
  } catch (error) {
    console.error(
      `❌ Failed to sync order to Mailchimp:`,
      error.response?.body || error.message
    );
    throw error;
  }
}

function formatOrderItems(items = []) {
  return items
    .map((item) => `${item.name} x${item.quantity} – $${item.totalPrice}`)
    .join(", ");
}

function formatShippingAddress(details = {}) {
  const {
    address = "",
    apartment = "",
    floor = "",
    city = "",
    zipCode = "",
    country = "",
  } = details;

  return `${address}${apartment ? ", Apt " + apartment : ""}${
    floor ? ", Floor " + floor : ""
  }, ${city} ${zipCode}, ${country}`;
}

module.exports = {
  addContactToAudience,
  addOrderToMailchimp,
};
