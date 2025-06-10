const PaymobService = require("../services/paymobService");
const { createOrder } = require("./orderController");
const Order = require("../models/order");
const Product = require("../models/Products");
const ProductVariant = require("../models/productVariant");
const Brand = require("../models/Brand");
const Notification = require("../models/notification");
const AdminNotification = require("../models/adminNotifications");
const user = require("../models/user");
const { addOrderToMailchimp } = require("../utils/mailchimp");

class PaymobController {
  static async getConfig(req, res) {
    try {
      const token = await PaymobService.getAuthToken();
      res.json({
        token,
        integrationId: process.env.PAYMOB_INTEGRATION_ID,
        iframeId: process.env.PAYMOB_IFRAME_ID,
      });
    } catch (error) {
      console.error("Error getting Paymob config:", error.message);
      res.status(500).json({
        error: "Failed to get Paymob configuration",
        details: error.message,
      });
    }
  }

  static async createPayment(req, res) {
    try {
      const { orderData } = req.body;

      if (!orderData || !orderData.total || !orderData.billingDetails) {
        return res.status(400).json({
          error: "Invalid order data",
          details: "Order data must include total and billing details",
        });
      }

      // Transform the frontend data structure to match our backend expectations
      const transformedOrderData = {
        total: orderData.total,
        customerId: orderData.customerId || req.user?.id, // Use authenticated user's ID if available
        shippingFee: orderData.shippingFee || 0,
        billingDetails: {
          firstName: orderData.billingDetails.first_name,
          lastName: orderData.billingDetails.last_name,
          email: orderData.billingDetails.email,
          phoneNumber: orderData.billingDetails.phone_number,
          address: orderData.billingDetails.street,
          country: orderData.billingDetails.country,
          city: orderData.billingDetails.city,
          zipCode: orderData.billingDetails.postal_code || "NA",
        },
        cartItems: orderData.items
          ? orderData.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              name: item.name,
              quantity: item.quantity,
              totalPrice: item.amount_cents
                ? item.amount_cents / 100
                : item.price || 0, // Convert from cents to dollars
              brandId: item.brandId,
            }))
          : [],
      };

      // Create order with fresh token and transformed order data
      const { order, authToken } = await PaymobService.createOrder(
        transformedOrderData.total,
        transformedOrderData
      );

      // Get payment key using the same token
      const paymentKey = await PaymobService.getPaymentKey(
        order.id,
        {
          amount: transformedOrderData.total,
          ...transformedOrderData.billingDetails,
        },
        authToken
      );

      // Create iframe URL
      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey.token}`;

      // Fix: Return the iframe_url property that the frontend is expecting
      res.json({
        success: true,
        iframe_url: iframeUrl, // This is the key change - use iframe_url instead of iframeUrl
        orderId: order.id,
        paymentKey: paymentKey.token,
      });
    } catch (error) {
      console.error("Error creating payment:", error.message);
      res.status(500).json({
        error: "Failed to create payment",
        details: error.message,
      });
    }
  }
  static async handleCallback(req, res) {
    try {
      const { hmac, obj } = req.body;

      if (!hmac || !obj) {
        return res.status(400).json({
          error: "Invalid callback data",
          details: "HMAC and payment object are required",
        });
      }

      // Verify the payment
      const isValid = await PaymobService.verifyPayment(hmac, obj);

      if (!isValid) {
        return res.status(400).json({
          error: "Invalid payment verification",
          details: "Payment verification failed",
        });
      }

      // Handle successful payment
      if (obj.success) {
        // Extract order data from the payment object
        const paymentData = obj;
        const customerData = paymentData.billing_data;

        // Get the original order data from the extras field
        const originalOrderData = paymentData.order.extras || {};

        // Prepare order data for our createOrder function
        const orderPayload = {
          customerId: originalOrderData.customerId || customerData.customer_id,
          cartItems: originalOrderData.cartItems || [], // Use original cart items from extras
          subtotal: paymentData.amount_cents / 100,
          shippingFee: originalOrderData.shippingFee || 0,
          total: paymentData.amount_cents / 100,
          orderStatus: "Pending",
          paymentDetails: {
            paymentMethod: "Paymob",
            transactionId: paymentData.id,
            paymentStatus: "Paid",
          },
          billingDetails: {
            firstName: customerData.first_name,
            lastName: customerData.last_name,
            email: customerData.email,
            phoneNumber: customerData.phone_number,
            address: customerData.street,
            country: customerData.country,
          },
        };

        // Create a mock request object for the createOrder function
        const mockReq = {
          body: orderPayload,
        };

        // Create a mock response object to capture the result
        const mockRes = {
          status: (code) => ({
            json: (data) => {
              if (code === 201) {
                res.json({
                  success: true,
                  message: "Payment processed and order created successfully",
                  orderId: data._id,
                });
              } else {
                res.status(code).json(data);
              }
            },
          }),
        };

        // Call the createOrder function from orderController
        await createOrder(mockReq, mockRes);
      } else {
        res.status(400).json({
          error: "Payment failed",
          details: obj.error_occured || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error handling payment callback:", error.message);
      res.status(500).json({
        error: "Failed to process payment callback",
        details: error.message,
      });
    }
  }
}

module.exports = PaymobController;
