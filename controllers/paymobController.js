const PaymobService = require("../services/paymobService");

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

      // Create order with fresh token
      const { order, authToken } = await PaymobService.createOrder(
        orderData.total
      );

      // Get payment key using the same token
      const paymentKey = await PaymobService.getPaymentKey(
        order.id,
        {
          amount: orderData.total,
          ...orderData.billingDetails,
        },
        authToken
      );

      // Create iframe URL
      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey.token}`;

      res.json({
        paymentKey: paymentKey.token,
        orderId: order.id,
        iframeUrl,
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
        // TODO: Update your order status in the database
        // You can add your order update logic here

        res.json({
          success: true,
          message: "Payment processed successfully",
          orderId: obj.order.id,
        });
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
