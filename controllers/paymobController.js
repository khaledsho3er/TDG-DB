const PaymobService = require("../services/paymobService");
const Order = require("../models/order");
const Product = require("../models/Products");
const ProductVariant = require("../models/productVariant");
const Brand = require("../models/Brand");
const Notification = require("../models/notification");
const AdminNotification = require("../models/adminNotifications");
const user = require("../models/user");
const { addOrderToMailchimp } = require("../utils/mailchimp");
const axios = require("axios");

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
        shippingDetails: {
          firstName:
            orderData.shippingDetails?.first_name ||
            orderData.billingDetails.first_name,
          lastName:
            orderData.shippingDetails?.last_name ||
            orderData.billingDetails.last_name,
          address:
            orderData.shippingDetails?.street ||
            orderData.billingDetails.street,
          phoneNumber:
            orderData.shippingDetails?.phone_number ||
            orderData.billingDetails.phone_number,
          country:
            orderData.shippingDetails?.country ||
            orderData.billingDetails.country,
          city:
            orderData.shippingDetails?.city || orderData.billingDetails.city,
          zipCode:
            orderData.shippingDetails?.postal_code ||
            orderData.billingDetails.postal_code ||
            "NA",
        },
        cartItems: orderData.items
          ? orderData.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              name: item.name,
              quantity: item.quantity,
              price:
                (item.amount_cents ? item.amount_cents / 100 : item.price) /
                item.quantity,
              totalPrice: item.amount_cents
                ? item.amount_cents / 100
                : item.price || 0, // Convert from cents to dollars
              brandId: item.brandId,
            }))
          : [],
      };

      console.log(
        "Transformed order data:",
        JSON.stringify(transformedOrderData, null, 2)
      );

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
        authToken,
        // Make sure to pass the correct callback URL
        `${
          process.env.API_BASE_URL || "https://api.thedesigngrit.com"
        }/api/paymob/callback`
      );

      // Create iframe URL
      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey.token}`;

      // Return the iframe_url property that the frontend is expecting
      res.json({
        success: true,
        iframe_url: iframeUrl,
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
  static async handleCallbackGet(req, res) {
    try {
      console.log("=== PAYMENT GET CALLBACK RECEIVED ===");
      console.log("Request query:", JSON.stringify(req.query, null, 2));

      // Extract parameters - try different possible names
      const success = req.query.success;
      const orderId = req.query.order || req.query.order_id || req.query.id;

      console.log(
        "GET callback received with success:",
        success,
        "orderId:",
        orderId
      );

      // If success parameter is present and true, create the order
      if (success === "true" && orderId) {
        console.log("Payment successful via GET, creating order...");

        try {
          // Fetch the order data from Paymob using the order ID
          const authToken = await PaymobService.getAuthToken();
          const response = await axios.get(
            `https://accept.paymob.com/api/ecommerce/orders/${orderId}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          const paymobOrder = response.data;
          console.log(
            "Paymob order data:",
            JSON.stringify(paymobOrder, null, 2)
          );

          // Extract order data from extras
          const orderExtras = paymobOrder.extras || {};
          console.log("Order extras:", JSON.stringify(orderExtras, null, 2));

          // Get cart items from extras or try to extract from Paymob order data
          let cartItems = orderExtras.cartItems || [];
          console.log(
            "Cart items from extras:",
            JSON.stringify(cartItems, null, 2)
          );

          // If cartItems is still empty, try to extract from Paymob order items
          if (
            cartItems.length === 0 &&
            paymobOrder.items &&
            paymobOrder.items.length > 0
          ) {
            console.log(
              "No cart items in extras, trying to extract from Paymob order items"
            );
            cartItems = paymobOrder.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId || null,
              brandId: item.brandId || null,
              name: item.name,
              price: item.amount_cents / 100 / (item.quantity || 1),
              quantity: item.quantity || 1,
              totalPrice: item.amount_cents / 100,
            }));
            console.log(
              "Extracted cart items from Paymob:",
              JSON.stringify(cartItems, null, 2)
            );
          }

          // If still empty, create a placeholder item based on order total
          if (cartItems.length === 0) {
            console.log("Creating placeholder cart item from order total");
            cartItems = [
              {
                productId: null,
                name: "Order Item",
                price: paymobOrder.amount_cents / 100,
                quantity: 1,
                totalPrice: paymobOrder.amount_cents / 100,
                brandId: null,
              },
            ];
          }

          // If we don't have a customerId in the extras, try to find a user by email
          let customerId = orderExtras.customerId;
          if (
            !customerId &&
            paymobOrder.shipping_data &&
            paymobOrder.shipping_data.email
          ) {
            console.log(
              "No customerId found in extras, looking up user by email:",
              paymobOrder.shipping_data.email
            );
            const foundUser = await user.findOne({
              email: paymobOrder.shipping_data.email,
            });
            if (foundUser) {
              customerId = foundUser._id;
              console.log("Found user by email, using customerId:", customerId);
            } else {
              // Create a new user if one doesn't exist
              console.log("No user found with email, creating a new user");
            }
          }

          if (!customerId) {
            console.error(
              "Could not determine customerId, using a default user"
            );
            // Use a default customer ID for guest checkouts (create a default user in your system)
            // This is a fallback - you should replace this with a real user ID from your database
          }

          // Create a new order in your database
          const newOrder = new Order({
            customerId: customerId,
            cartItems: cartItems.map((item) => ({
              productId: item.productId || item.product_id,
              variantId: item.variantId || item.variant_id,
              name: item.name,
              price: item.price || item.totalPrice / item.quantity,
              quantity: item.quantity || 1,
              totalPrice: item.totalPrice || item.amount_cents / 100,
              brandId: item.brandId || item.brand_id,
            })),
            subtotal: paymobOrder.amount_cents / 100,
            shippingFee: orderExtras.shippingFee || 0,
            total: paymobOrder.amount_cents / 100,
            orderStatus: "Pending",
            paymentDetails: {
              paymentMethod: "paymob",
              transactionId: orderId,
              paymentStatus: "Paid",
            },
            billingDetails: {
              firstName:
                paymobOrder.shipping_data?.first_name ||
                orderExtras.billingDetails?.firstName ||
                "Customer",
              lastName:
                paymobOrder.shipping_data?.last_name ||
                orderExtras.billingDetails?.lastName ||
                "Name",
              email:
                paymobOrder.shipping_data?.email ||
                orderExtras.billingDetails?.email ||
                "customer@example.com",
              phoneNumber:
                paymobOrder.shipping_data?.phone_number ||
                orderExtras.billingDetails?.phoneNumber ||
                "N/A",
              address:
                paymobOrder.shipping_data?.street ||
                orderExtras.billingDetails?.address ||
                "N/A",
              country:
                paymobOrder.shipping_data?.country ||
                orderExtras.billingDetails?.country ||
                "N/A",
              city:
                paymobOrder.shipping_data?.city ||
                orderExtras.billingDetails?.city ||
                "N/A",
              zipCode:
                paymobOrder.shipping_data?.postal_code ||
                orderExtras.billingDetails?.zipCode ||
                "N/A",
            },
            shippingDetails: {
              firstName:
                paymobOrder.shipping_data?.first_name ||
                orderExtras.shippingDetails?.firstName ||
                "Customer",
              lastName:
                paymobOrder.shipping_data?.last_name ||
                orderExtras.shippingDetails?.lastName ||
                "Name",
              address:
                paymobOrder.shipping_data?.street ||
                orderExtras.shippingDetails?.address ||
                "N/A",
              phoneNumber:
                paymobOrder.shipping_data?.phone_number ||
                orderExtras.shippingDetails?.phoneNumber ||
                "N/A",
              country:
                paymobOrder.shipping_data?.country ||
                orderExtras.shippingDetails?.country ||
                "N/A",
              city:
                paymobOrder.shipping_data?.city ||
                orderExtras.shippingDetails?.city ||
                "N/A",
              zipCode:
                paymobOrder.shipping_data?.postal_code ||
                orderExtras.shippingDetails?.zipCode ||
                "N/A",
            },
          });

          console.log("New order object:", JSON.stringify(newOrder, null, 2));

          // Save the order
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
              } else if (item.productId) {
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
              console.error(`Error updating stock for item:`, stockError);
            }
          }

          // Try to add the order to Mailchimp
          try {
            if (savedOrder.billingDetails && savedOrder.billingDetails.email) {
              await addOrderToMailchimp(
                savedOrder.billingDetails.email,
                savedOrder
              );
              console.log("Order added to Mailchimp successfully");
            }
          } catch (mailchimpError) {
            console.error("Failed to add order to Mailchimp:", mailchimpError);
          }

          // Redirect to success page with the order ID
          return res.redirect(
            `https://thedesigngrit.com/home?order=${savedOrder._id}&status=success`
          );
        } catch (error) {
          console.error("Error creating order:", error);
          // Redirect to success page anyway, but without order ID
          return res.redirect(`https://thedesigngrit.com/home?status=success`);
        }
      } else {
        console.log("Payment failed via GET, redirecting to failure page");
        return res.redirect("https://thedesigngrit.com/payment-failed");
      }
    } catch (error) {
      console.error("Error handling GET callback:", error);
      return res.redirect("https://thedesigngrit.com/payment-failed");
    }
  }

  static async handleCallbackPost(req, res) {
    try {
      console.log("=== PAYMENT POST CALLBACK RECEIVED ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));

      const { hmac, obj } = req.body;

      if (!hmac || !obj) {
        console.error("Missing hmac or obj in request body");
        return res.status(400).json({
          error: "Invalid callback data",
          details: "HMAC and payment object are required",
        });
      }

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
        let customerId = originalOrderData.customerId;
        if (!customerId && customerData && customerData.email) {
          console.log(
            "No customerId found in extras, looking up user by email:",
            customerData.email
          );
          const foundUser = await user.findOne({ email: customerData.email });
          if (foundUser) {
            customerId = foundUser._id;
            console.log("Found user by email, using customerId:", customerId);
          } else {
            // Create a new user if one doesn't exist
            console.log("No user found with email, creating a new user");
          }
        }

        if (!customerId) {
          console.error("Could not determine customerId, using a default user");
        }

        // Check if we have cart items
        if (
          !originalOrderData.cartItems ||
          !Array.isArray(originalOrderData.cartItems) ||
          originalOrderData.cartItems.length === 0
        ) {
          console.error("No valid cart items found in order data");
          return res.status(400).json({ error: "Invalid cart items" });
        }

        try {
          // Create a new order directly
          console.log("Creating new order...");
          const newOrder = new Order({
            customerId: customerId,
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
              paymentMethod: "paymob", // Changed from "Paymob" to "paymob" to match enum
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
              } else if (item.productId) {
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
              console.error(`Error updating stock for item:`, stockError);
            }
          }

          // Try to add the order to Mailchimp
          try {
            if (savedOrder.billingDetails && savedOrder.billingDetails.email) {
              await addOrderToMailchimp(
                savedOrder.billingDetails.email,
                savedOrder
              );
              console.log("Order added to Mailchimp successfully");
            }
          } catch (mailchimpError) {
            console.error("Failed to add order to Mailchimp:", mailchimpError);
          }

          // Return success response for POST request
          return res.status(200).json({
            success: true,
            message: "Order processed successfully",
            orderId: savedOrder._id,
          });
        } catch (orderError) {
          console.error("Error creating order:", orderError);
          return res.status(500).json({
            error: "Failed to create order",
            details: orderError.message,
          });
        }
      } else {
        console.log("Payment failed:", obj.error_occured || "Unknown error");
        return res.status(400).json({
          error: "Payment failed",
          details: obj.error_occured || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Unhandled error in payment callback:", error);
      return res.status(500).json({
        error: "Server error",
        details: error.message,
      });
    }
  }
}

module.exports = PaymobController;
