const crypto = require("crypto");
const mailchimp = require("@mailchimp/mailchimp_marketing");
require("dotenv").config();

const listId = process.env.MAILCHIMP_AUDIENCE_ID;

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
});

async function addContactToAudience(email, firstName = "", lastName = "") {
  try {
    const response = await mailchimp.lists.addListMember(listId, {
      email_address: email,
      status: "subscribed",
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName,
      },
    });
    console.log(`Successfully added contact: ${email}`, response);
    return response;
  } catch (error) {
    console.error("Error adding contact:", error);
    throw error;
  }
}

async function tagAbandonedCart(email) {
  const subscriberHash = crypto
    .createHash("md5")
    .update(email.toLowerCase())
    .digest("hex");

  await mailchimp.lists.updateListMemberTags(listId, subscriberHash, {
    tags: [{ name: "cart-abandoned", status: "active" }],
  });

  console.log(`✅ Tagged ${email} with cart-abandoned`);
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

async function addOrderToMailchimp(email, order) {
  const subscriberHash = crypto
    .createHash("md5")
    .update(email.toLowerCase())
    .digest("hex");

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
    ORDER_CONFIRM_TEST: "true",
  };

  const tags = ["order-confirm-test"];

  try {
    await mailchimp.lists.setListMember(listId, subscriberHash, {
      email_address: email,
      status_if_new: "subscribed",
      merge_fields: mergeFields,
      tags: tags,
    });

    await mailchimp.lists.updateListMemberTags(listId, subscriberHash, {
      tags: [{ name: "order-confirm-test", status: "active" }],
    });

    console.log(`✅ Order ${order._id} synced with Mailchimp for ${email}`);
  } catch (error) {
    console.error(
      `❌ Failed to sync order:`,
      error.response?.body || error.message
    );
    throw error;
  }
}

module.exports = {
  addContactToAudience,
  addOrderToMailchimp,
  tagAbandonedCart,
};
