const axios = require("axios");
require("dotenv").config();

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;
const PAYMOB_IFRAME_ID = process.env.PAYMOB_IFRAME_ID;
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET;

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

      if (!response.data || !response.data.token) {
        throw new Error("Invalid response from Paymob auth endpoint");
      }

      return response.data.token;
    } catch (error) {
      console.error(
        "Error getting Paymob auth token:",
        error.response?.data || error.message
      );
      throw new Error("Failed to authenticate with Paymob");
    }
  }

  static async createOrder(amount, orderData) {
    try {
      // Get fresh token for this request
      const authToken = await this.getAuthToken();

      // Prepare items for Paymob
      const items = orderData.cartItems.map((item) => ({
        name: item.name,
        amount_cents: Math.round((item.totalPrice || 0) * 100), // Ensure we have a value even if totalPrice is undefined
        description: item.name,
        quantity: item.quantity,
        product_id: item.productId,
        brand_id: item.brandId,
        variant_id: item.variantId || null,
      }));

      // Log the items for debugging
      console.log("Prepared items for Paymob:", JSON.stringify(items, null, 2));
      console.log("Order data:", JSON.stringify(orderData, null, 2));

      const response = await paymobAxios.post("/ecommerce/orders", {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: Math.round(amount * 100),
        currency: "EGP",
        items: items,
        customer_id: orderData.customerId,
        shipping_fee: orderData.shippingFee || 0,
        extras: {
          order_id: orderData.parentOrderId, // If you have a parent order ID
          customer_email: orderData.billingDetails.email,
          customer_phone: orderData.billingDetails.phoneNumber,
          // Store the original cart items with all necessary fields
          cartItems: orderData.cartItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice,
            brandId: item.brandId,
          })),
          customerId: orderData.customerId,
          shippingFee: orderData.shippingFee,
          billingDetails: orderData.billingDetails,
          shippingDetails: orderData.shippingDetails,
        },
      });

      console.log(
        "Paymob order created:",
        JSON.stringify(response.data, null, 2)
      );
      return { order: response.data, authToken };
    } catch (error) {
      console.error(
        "Error creating Paymob order:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
  static async getPaymentKey(orderId, billingData, authToken, callbackUrl) {
    try {
      if (!authToken || !orderId) {
        throw new Error("Authentication token and order ID are required");
      }

      const payload = {
        auth_token: authToken,
        amount_cents: Math.round(billingData.amount * 100),
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: billingData.apartment || "NA",
          email: billingData.email,
          floor: billingData.floor || "NA",
          first_name: billingData.firstName,
          last_name: billingData.lastName,
          street: billingData.address,
          building: billingData.building || "NA",
          phone_number: billingData.phoneNumber,
          shipping_method: billingData.shippingMethod || "NA",
          postal_code: billingData.postal_code || "NA",
          city: billingData.city || "NA",
          country: billingData.country,
          state: billingData.state || "NA",
        },
        currency: "EGP",
        integration_id: PAYMOB_INTEGRATION_ID,
        // Include both callback URLs
        return_callback_url: callbackUrl,
        transaction_processed_callback_url: callbackUrl,
        // Add additional order data
        extras: {
          // Map cart items with all necessary fields
          cartItems: billingData.cartItems
            ? billingData.cartItems.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                name: item.name,
                quantity: item.quantity,
                price: item.price || item.totalPrice / item.quantity,
                totalPrice: item.totalPrice || item.price * item.quantity,
                brandId: item.brandId,
              }))
            : [],
          customerId: billingData.customerId,
          shippingFee: billingData.shippingFee,
          total: billingData.amount,
          billingDetails: {
            firstName: billingData.firstName,
            lastName: billingData.lastName,
            email: billingData.email,
            phoneNumber: billingData.phoneNumber,
            address: billingData.address,
            country: billingData.country,
            city: billingData.city,
            zipCode: billingData.postal_code || "NA",
          },
          shippingDetails: billingData.shippingDetails || {
            firstName: billingData.firstName,
            lastName: billingData.lastName,
            address: billingData.address,
            phoneNumber: billingData.phoneNumber,
            country: billingData.country,
            city: billingData.city,
            zipCode: billingData.postal_code || "NA",
          },
        },
      };

      console.log("Payment key payload:", JSON.stringify(payload, null, 2));

      const response = await paymobAxios.post(
        "/acceptance/payment_keys",
        payload
      );

      if (!response.data || !response.data.token) {
        throw new Error("Invalid response from Paymob payment key endpoint");
      }

      return {
        token: response.data.token,
      };
    } catch (error) {
      console.error(
        "Error getting Paymob payment key:",
        error.response?.data || error.message
      );
      throw new Error("Failed to get Paymob payment key");
    }
  }

  static async verifyPayment(hmac, obj) {
    try {
      if (!hmac || !obj) {
        throw new Error(
          "HMAC and payment object are required for verification"
        );
      }

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
      console.error("Error verifying payment:", error.message);
      throw new Error("Failed to verify payment");
    }
  }

  // Helper method to execute a Paymob operation with fresh token
  static async executeWithFreshToken(operation) {
    try {
      const authToken = await this.getAuthToken();
      return await operation(authToken);
    } catch (error) {
      console.error("Error executing Paymob operation:", error.message);
      throw error;
    }
  }
}

module.exports = PaymobService;
