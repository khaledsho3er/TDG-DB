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
      console.error("Error getting Paymob config:", error);
      res.status(500).json({ error: "Failed to get Paymob configuration" });
    }
  }

  static async createPayment(req, res) {
    try {
      const { orderData } = req.body;

      // Get authentication token
      const authToken = await PaymobService.getAuthToken();

      // Create order
      const order = await PaymobService.createOrder(authToken, orderData.total);

      // Get payment key
      const paymentKey = await PaymobService.getPaymentKey(
        authToken,
        order.id,
        {
          amount: orderData.total,
          ...orderData.billingDetails,
        }
      );

      // Create iframe URL
      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey.token}`;

      res.json({
        paymentKey: paymentKey.token,
        orderId: order.id,
        iframeUrl,
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  }

  static async handleCallback(req, res) {
    try {
      const { hmac, obj } = req.body;

      // Verify the payment
      const isValid = await PaymobService.verifyPayment(hmac, obj);

      if (!isValid) {
        return res.status(400).json({ error: "Invalid payment verification" });
      }

      // Handle successful payment
      if (obj.success) {
        // Update your order status in the database
        // You can add your order update logic here

        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Payment failed" });
      }
    } catch (error) {
      console.error("Error handling payment callback:", error);
      res.status(500).json({ error: "Failed to process payment callback" });
    }
  }
}

module.exports = PaymobController;
