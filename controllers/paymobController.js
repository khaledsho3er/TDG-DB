const PaymobService = require("../services/paymobService");
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
      console.log("=== PAYMENT CALLBACK RECEIVED ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));

      const { hmac, obj } = req.body;

      if (!hmac || !obj) {
        console.error("Missing hmac or obj in request body");
        return res.status(400).json({
          error: "Invalid callback data",
          details: "HMAC and payment object are required",
        });
      }

      // Log the payment object
      console.log("Payment object:", JSON.stringify(obj, null, 2));

      // Verify the payment
      console.log("Verifying payment...");
      const isValid = await PaymobService.verifyPayment(hmac, obj);
      console.log("Payment verification result:", isValid);

      if (!isValid) {
        console.error("Payment verification failed");
        return res.status(400).json({
          error: "Invalid payment verification",
          details: "Payment verification failed",
        });
      }

      // Handle successful payment
      if (obj.success) {
        console.log("Payment successful, processing order...");

        // Extract order data from the payment object
        const paymentData = obj;
        const customerData = paymentData.billing_data;

        // Get the original order data from the extras field
        const originalOrderData = paymentData.order?.extras || {};

        console.log(
          "Original order data:",
          JSON.stringify(originalOrderData, null, 2)
        );
        console.log("Customer data:", JSON.stringify(customerData, null, 2));

        // Check if we have a customerId
        if (!originalOrderData.customerId) {
          console.error("No customerId found in order data");
          return res.redirect(
            "https://thedesigngrit.com/payment-error?reason=missing_customer_id"
          );
        }

        // Check if we have cart items
        if (
          !originalOrderData.cartItems ||
          !Array.isArray(originalOrderData.cartItems) ||
          originalOrderData.cartItems.length === 0
        ) {
          console.error("No valid cart items found in order data");
          return res.redirect(
            "https://thedesigngrit.com/payment-error?reason=invalid_cart_items"
          );
        }

        try {
          // Create a new order directly
          console.log("Creating new order...");
          const newOrder = new Order({
            customerId: originalOrderData.customerId,
            cartItems: originalOrderData.cartItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              name: item.name,
              price: item.price || item.totalPrice / item.quantity,
              quantity: item.quantity,
              totalPrice: item.totalPrice,
              brandId: item.brandId,
            })),
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
              firstName: customerData.first_name || "Customer",
              lastName: customerData.last_name || "Name",
              email: customerData.email || "customer@example.com",
              phoneNumber: customerData.phone_number || "N/A",
              address: customerData.street || "N/A",
              country: customerData.country || "N/A",
              city: customerData.city || "N/A",
              zipCode: customerData.postal_code || "N/A",
            },
            shippingDetails: {
              firstName: customerData.first_name || "Customer",
              lastName: customerData.last_name || "Name",
              address: customerData.street || "N/A",
              phoneNumber: customerData.phone_number || "N/A",
              country: customerData.country || "N/A",
              city: customerData.city || "N/A",
              zipCode: customerData.postal_code || "N/A",
            },
          });

          console.log(
            "Order object created:",
            JSON.stringify(newOrder, null, 2)
          );

          // Save the order to the database
          console.log("Saving order to database...");
          const savedOrder = await newOrder.save();
          console.log("Order saved successfully with ID:", savedOrder._id);

          // Update product stock after order is saved
          console.log("Updating product stock...");
          for (const item of savedOrder.cartItems) {
            try {
              if (item.variantId) {
                const variant = await ProductVariant.findById(item.variantId);
                if (variant) {
                  variant.stock = Math.max(0, variant.stock - item.quantity);
                  await variant.save();
                  console.log(
                    `Updated variant ${variant._id} stock to ${variant.stock}`
                  );
                }
              } else {
                const product = await Product.findById(item.productId);
                if (product) {
                  product.stock = Math.max(0, product.stock - item.quantity);
                  product.sales = (product.sales || 0) + item.quantity;
                  await product.save();
                  console.log(
                    `Updated product ${product._id} stock to ${product.stock}`
                  );
                }
              }
            } catch (stockError) {
              console.error(
                `Error updating stock for item ${item.productId}:`,
                stockError
              );
              // Continue with other items even if one fails
            }
          }

          // Create notifications
          try {
            console.log("Creating notifications...");
            const customer = await user.findById(originalOrderData.customerId);

            if (customer) {
              console.log("Customer found:", customer._id);

              // Get the first item's brandId
              const firstItem = savedOrder.cartItems[0];
              if (firstItem && firstItem.brandId) {
                // Create brand notification
                const notification = new Notification({
                  type: "order",
                  description: `New order received from ${
                    customer.email || "a customer"
                  }`,
                  brandId: firstItem.brandId,
                  orderId: savedOrder._id,
                  read: false,
                });
                await notification.save();
                console.log("Brand notification created");

                // Create admin notification
                const adminNotification = new AdminNotification({
                  type: "order",
                  description: `New order #${savedOrder._id} created`,
                  read: false,
                });
                await adminNotification.save();
                console.log("Admin notification created");

                // Sync with Mailchimp if customer has email
                if (customer.email) {
                  try {
                    await addOrderToMailchimp(customer.email, savedOrder);
                    console.log("Order synced with Mailchimp");
                  } catch (mailchimpError) {
                    console.error("Mailchimp sync error:", mailchimpError);
                  }
                }
              }
            }
          } catch (notificationError) {
            console.error("Error creating notifications:", notificationError);
            // Continue even if notifications fail
          }

          // Redirect to success page
          console.log("Redirecting to success page...");
          return res.redirect(
            `https://thedesigngrit.com/home?order=${savedOrder._id}&status=success`
          );
        } catch (orderError) {
          console.error("Error creating order:", orderError);
          return res.redirect(
            `https://thedesigngrit.com/payment-error?reason=${encodeURIComponent(
              orderError.message
            )}`
          );
        }
      } else {
        console.log("Payment failed:", obj.error_occured || "Unknown error");
        return res.redirect("https://thedesigngrit.com/payment-failed");
      }
    } catch (error) {
      console.error("Unhandled error in payment callback:", error);
      return res.redirect(
        `https://thedesigngrit.com/payment-error?reason=${encodeURIComponent(
          error.message
        )}`
      );
    }
  }
}

module.exports = PaymobController;
