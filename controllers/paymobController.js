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

        console.log(
          "Payment successful, original order data:",
          JSON.stringify(originalOrderData, null, 2)
        );
        console.log("Customer data:", JSON.stringify(customerData, null, 2));

        // Ensure we have cart items
        if (
          !originalOrderData.cartItems ||
          originalOrderData.cartItems.length === 0
        ) {
          console.error("No cart items found in payment data");
          return res.redirect(
            "https://thedesigngrit.com/payment-error?reason=no_cart_items"
          );
        }

        // Prepare order data
        const orderData = {
          customerId: originalOrderData.customerId,
          cartItems: originalOrderData.cartItems,
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
            city: customerData.city || "NA",
            zipCode: customerData.postal_code || "NA",
          },
          shippingDetails: {
            firstName: customerData.first_name,
            lastName: customerData.last_name,
            address: customerData.street,
            phoneNumber: customerData.phone_number,
            country: customerData.country,
            city: customerData.city || "NA",
            zipCode: customerData.postal_code || "NA",
          },
        };

        console.log(
          "Creating order with data:",
          JSON.stringify(orderData, null, 2)
        );

        // Create the order directly using the Order model
        try {
          // First, update product stock and other related data
          const updatedCartItems = await Promise.all(
            orderData.cartItems.map(async (item) => {
              let product, variant;

              // Handle variant or regular product
              if (item.variantId) {
                variant = await ProductVariant.findById(item.variantId);
                if (!variant)
                  throw new Error(`Variant not found: ${item.variantId}`);

                product = await Product.findById(variant.productId);
                if (!product)
                  throw new Error(
                    `Product not found for variant: ${item.variantId}`
                  );

                // Update variant stock
                variant.stock -= item.quantity;
                await variant.save();

                // Update product sales
                product.sales = (product.sales || 0) + item.quantity;
                await product.save();
              } else {
                product = await Product.findById(item.productId);
                if (!product)
                  throw new Error(`Product not found: ${item.productId}`);

                // Update product stock and sales
                product.stock -= item.quantity;
                product.sales = (product.sales || 0) + item.quantity;
                await product.save();
              }

              // Get brand and calculate commission and tax
              const brand = await Brand.findById(product.brandId);
              if (!brand)
                throw new Error(`Brand not found for product: ${product._id}`);

              const commissionAmount =
                item.totalPrice * (brand.commissionRate || 0.15);
              const taxAmount = item.totalPrice * (brand.taxRate || 0.14);

              // Create updated cart item
              return {
                ...item,
                productId: item.productId,
                brandId: product.brandId,
                commissionAmount,
                taxAmount,
                variantId: item.variantId || undefined,
              };
            })
          );

          // Create and save the new order
          const newOrder = new Order({
            ...orderData,
            cartItems: updatedCartItems,
          });

          const savedOrder = await newOrder.save();
          console.log("Order saved successfully:", savedOrder._id);

          // Create notifications
          const customer = await user.findById(orderData.customerId);
          if (customer && customer.email) {
            // Create notification for the brand
            const brandId = updatedCartItems[0].brandId;
            const newNotification = new Notification({
              type: "order",
              description: `You have received a new order from customer ${
                customer.email
              }\nProduct: ${savedOrder.cartItems
                .map((item) => item.name)
                .join(", ")}\nTotal Price: ${savedOrder.total}.`,
              brandId,
              orderId: savedOrder._id,
              read: false,
            });
            await newNotification.save();

            // Create notification for admin
            const brand = await Brand.findById(brandId);
            const brandName = brand ? brand.brandName : "Unknown Brand";
            const adminNotification = new AdminNotification({
              type: "order",
              description: `New order #${savedOrder._id} created by ${
                customer.email
              } for $${savedOrder.total}. Products: ${savedOrder.cartItems
                .map((item) => item.name)
                .join(", ")} from brand: ${brandName}`,
              read: false,
            });
            await adminNotification.save();

            // Sync with Mailchimp
            await addOrderToMailchimp(customer.email, savedOrder);
          }

          // Redirect to success page with order ID
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
        // For failed payments, redirect to an error page
        console.log("Payment failed:", obj.error_occured || "Unknown error");
        return res.redirect("https://thedesigngrit.com/payment-failed");
      }
    } catch (error) {
      console.error("Error handling payment callback:", error.message);
      // Redirect to error page in case of exceptions
      return res.redirect(
        `https://thedesigngrit.com/payment-error?reason=${encodeURIComponent(
          error.message
        )}`
      );
    }
  }
}

module.exports = PaymobController;
