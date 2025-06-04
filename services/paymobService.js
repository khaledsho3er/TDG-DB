const axios = require("axios");
require("dotenv").config();

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;

const paymobAxios = axios.create({
  baseURL: "https://accept.paymob.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

class PaymobService {
  static async getAuthToken() {
    try {
      const response = await paymobAxios.post("/auth/tokens", {
        api_key: PAYMOB_API_KEY,
      });
      return response.data.token;
    } catch (error) {
      console.error("Error getting Paymob auth token:", error);
      throw error;
    }
  }

  static async createOrder(authToken, amount) {
    try {
      const response = await paymobAxios.post("/ecommerce/orders", {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: Math.round(amount * 100),
        currency: "EGP",
        items: [],
      });
      return response.data;
    } catch (error) {
      console.error("Error creating Paymob order:", error);
      throw error;
    }
  }

  static async getPaymentKey(authToken, orderId, billingData) {
    try {
      const response = await paymobAxios.post("/acceptance/payment_keys", {
        auth_token: authToken,
        amount_cents: Math.round(billingData.amount * 100),
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: "NA",
          email: billingData.email,
          floor: "NA",
          first_name: billingData.firstName,
          street: billingData.address,
          building: "NA",
          phone_number: billingData.phoneNumber,
          shipping_method: "NA",
          postal_code: "NA",
          city: "NA",
          country: billingData.country,
          last_name: billingData.lastName,
          state: "NA",
        },
        currency: "EGP",
        integration_id: PAYMOB_INTEGRATION_ID,
      });
      return response.data;
    } catch (error) {
      console.error("Error getting payment key:", error);
      throw error;
    }
  }

  static async verifyPayment(hmac, obj) {
    try {
      const data =
        obj.id +
        obj.amount_cents +
        obj.created_at +
        obj.currency +
        obj.error_occured +
        obj.has_parent_transaction +
        obj.is_3d_secure +
        obj.is_auth +
        obj.is_capture +
        obj.is_refunded +
        obj.is_standalone_payment +
        obj.is_voided +
        obj.order.id +
        obj.source_data.pan +
        obj.source_data.type +
        obj.success;
      const hash = require("crypto")
        .createHmac("sha512", PAYMOB_HMAC_SECRET)
        .update(data)
        .digest("hex");

      return hash === hmac;
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw error;
    }
  }
}

module.exports = PaymobService;
