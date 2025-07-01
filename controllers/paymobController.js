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
const { sendEmail } = require("../services/awsSes");
const fs = require("fs");
const path = require("path");
const Quotation = require("../models/quotation");

function generateOrderReceiptEmail(order) {
  return `
    <h2>Thank you for your order!</h2>
    <p>Order ID: <strong>${order._id}</strong></p>
    <p>Total: <strong>${order.total} E£</strong></p>
    <p>Products:</p>
    <ul>
      ${order.cartItems
        .map(
          (item) =>
            `<li>${item.name} x${item.quantity} — ${item.totalPrice} E£</li>`
        )
        .join("")}
    </ul>
    <p>We will begin processing your order shortly. If you have any questions, reply to this email.</p>
  `;
}

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
        customerId: orderData.customerId || req.user?.id,
        shippingFee: orderData.shippingFee || 0,
        total: orderData.total,
        subtotal: orderData.subtotal || 0,
        taxAmount: orderData.taxAmount || 0, // VAT
        fees: orderData.fees || +((orderData.total || 0) * 0.03).toFixed(2),
        convertedAmount: orderData.convertedAmount || orderData.total,
        billingDetails: {
          firstName: orderData.billingDetails.first_name,
          lastName: orderData.billingDetails.last_name,
          email: orderData.billingDetails.email,
          phoneNumber: orderData.billingDetails.phone_number,
          address:
            orderData.billingDetails.address ||
            orderData.shippingDetails?.address,
          country: orderData.billingDetails.country,
          floor:
            orderData.billingDetails.floor || orderData.shippingDetails?.floor,
          apartment:
            orderData.billingDetails.apartment ||
            orderData.shippingDetails?.apartment,
          label:
            orderData.billingDetails.label || orderData.shippingDetails?.label,
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
            orderData.billingDetails.street ||
            orderData.billingDetails.address ||
            orderData.shippingDetails.address,
          phoneNumber:
            orderData.shippingDetails?.phone_number ||
            orderData.billingDetails.phone_number,
          floor:
            orderData.billingDetails?.floor ||
            orderData.shippingDetails?.floor ||
            "101",
          apartment:
            orderData.billingDetails?.apartment ||
            orderData.shippingDetails?.apartment ||
            "101",
          label:
            orderData.billingDetails?.label ||
            orderData.shippingDetails?.label ||
            "Homess",

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
          ? orderData.items.map((item) => {
              const cartItem = {
                productId: item.productId,
                variantId: item.variantId,
                name: item.name,
                quantity: item.quantity,
                price:
                  (item.amount_cents ? item.amount_cents / 100 : item.price) /
                  item.quantity,
                totalPrice: item.amount_cents
                  ? item.amount_cents / 100
                  : item.price || 0,
                brandId: item.brandId,
                fromQuotation: item.fromQuotation ?? false,
                quotationId: item.quotationId ?? null,
              };
              if (item.color) cartItem.color = item.color;
              if (item.size) cartItem.size = item.size;
              if (item.material) cartItem.material = item.material;
              if (item.customization)
                cartItem.customization = item.customization;
              return cartItem;
            })
          : [],
      };

      console.log(
        "Transformed order data:",
        JSON.stringify(transformedOrderData, null, 2)
      );

      // Create the Paymob order with the transformed data
      const { order: paymobOrder, authToken } = await PaymobService.createOrder(
        transformedOrderData.total,
        transformedOrderData
      );

      // Get payment key using the same token
      const paymentKey = await PaymobService.getPaymentKey(
        paymobOrder.id,
        {
          amount: transformedOrderData.total,
          email: transformedOrderData.billingDetails.email,
          firstName: transformedOrderData.billingDetails.firstName,
          lastName: transformedOrderData.billingDetails.lastName,
          address: transformedOrderData.billingDetails.address,
          phoneNumber: transformedOrderData.billingDetails.phoneNumber,
          country: transformedOrderData.billingDetails.country,
          city: transformedOrderData.billingDetails.city,
          postal_code: transformedOrderData.billingDetails.zipCode,
          cartItems: transformedOrderData.cartItems,
          customerId: transformedOrderData.customerId,
          shippingFee: transformedOrderData.shippingFee,
          billingDetails: transformedOrderData.billingDetails,
          shippingDetails: transformedOrderData.shippingDetails,
        },
        authToken,
        `${
          process.env.API_BASE_URL || "https://api.thedesigngrit.com"
        }/api/paymob/callback`
      );
      // Save the transformed order data in an object
      // that can be accessed in other functions
      PaymobController.transformedOrderData = transformedOrderData;
      // Create iframe URL
      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey.token}`;

      // Return the iframe_url property that the frontend is expecting
      res.json({
        success: true,
        iframe_url: iframeUrl,
        orderId: paymobOrder.id,
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
          // Create a new order in your database
          const orderData = PaymobController.transformedOrderData || {};
          console.log(
            "Transformed order data in handle callback:",
            JSON.stringify(orderData, null, 2)
          );
          // Build the cart items with commission and tax per item
          const cartItems = (orderData.cartItems || []).map((item) => {
            const totalPrice = item.totalPrice || item.price * item.quantity;
            const commission = +(totalPrice * 0.15).toFixed(2);
            const tax = +(totalPrice * 0.14).toFixed(2);
            return {
              productId: item.productId,
              variantId: item.variantId,
              name: item.name,
              quantity: item.quantity,
              price: item.price || totalPrice / item.quantity,
              totalPrice,
              brandId: item.brandId,
              fromQuotation: item.fromQuotation || false,
              quotationId: item.quotationId || null,
              commissionAmount: commission,
              taxAmount: tax,
              color: item.color,
              size: item.size,
              material: item.material,
              customization: item.customization,
            };
          });

          const subtotal = orderData.total || paymobOrder.amount_cents / 100;
          const shippingFee =
            orderData.shippingFee || orderExtras.shippingFee || 0;
          const total = subtotal;

          const productTotal = cartItems.reduce(
            (sum, item) => sum + item.totalPrice,
            0
          );
          const totalCommission = cartItems.reduce(
            (sum, item) => sum + item.commissionAmount,
            0
          );
          const vat = +(productTotal * 0.14).toFixed(2);
          const paymobFee = +(total * 0.03).toFixed(2);
          const brandPayout = +(total - vat - totalCommission).toFixed(2);
          const netAdminProfit = +(totalCommission - paymobFee).toFixed(2);
          const convertedAmount = paymobOrder.converted_amount || 0;
          const capturedAmount = paymobOrder.captured_amount
            ? paymobOrder.captured_amount / 100
            : 0;

          // Create a new order in your database
          const newOrder = new Order({
            customerId: orderData.customerId || orderExtras.customerId,
            cartItems,
            subtotal: total,
            shippingFee,
            total,
            orderStatus: "Pending",
            paymentDetails: {
              paymentMethod: "paymob",
              transactionId: orderId,
              paymentStatus: "Paid",
            },
            billingDetails: orderData.billingDetails ||
              orderExtras.billingDetails || {
                firstName: paymobOrder.shipping_data?.first_name || "Customer",
                lastName: paymobOrder.shipping_data?.last_name || "Name",
                email:
                  paymobOrder.shipping_data?.email || "customer@example.com",
                phoneNumber: paymobOrder.shipping_data?.phone_number || "N/A",
                address: paymobOrder.shipping_data?.street || "N/A",
                country: paymobOrder.shipping_data?.country || "N/A",
                city: paymobOrder.shipping_data?.city || "N/A",
                zipCode: paymobOrder.shipping_data?.postal_code || "N/A",
              },
            shippingDetails: orderData.shippingDetails ||
              orderExtras.shippingDetails || {
                firstName: paymobOrder.shipping_data?.first_name || "Customer",
                lastName: paymobOrder.shipping_data?.last_name || "Name",
                address: paymobOrder.shipping_data?.street || "N/A",
                phoneNumber: paymobOrder.shipping_data?.phone_number || "N/A",
                floor: paymobOrder.billingDetails?.floor || "N/A",
                apartment: paymobOrder.billingDetails?.apartment || "N/A",
                label: paymobOrder.billingDetails?.label || "N/A",
                country: paymobOrder.shipping_data?.country || "N/A",
                city: paymobOrder.shipping_data?.city || "N/A",
                zipCode: paymobOrder.shipping_data?.postal_code || "N/A",
              },
            vat,
            fees: paymobFee,
            brandPayout,
            netAdminProfit,
            convertedAmount,
            capturedAmount,
          });

          console.log("New order object:", JSON.stringify(newOrder, null, 2));

          // Save the order
          const savedOrder = await newOrder.save();
          console.log("Order saved successfully with ID:", savedOrder._id);
          console.log("Order saved successfully with ID:", savedOrder._id);
          console.log(
            "All data in savedOrder:",
            savedOrder.email || "No email",
            "cart Items",
            savedOrder.cartItems || "No cart items",
            "brand Ids",
            savedOrder.cartItems.map((item) => item.brandId) || "No brand IDs"
          );
          // === Notification Logic Start ===
          try {
            const customerEmail = savedOrder.billingDetails?.email || "Unknown";
            const uniqueBrandIds = [
              ...new Set(
                savedOrder.cartItems.map((item) => item.brandId?.toString())
              ),
            ];

            for (const brandId of uniqueBrandIds) {
              if (!brandId) continue;

              const brand = await Brand.findById(brandId);
              const brandName = brand?.brandName || "Unknown Brand";

              const newNotification = new Notification({
                type: "order",
                description: `You have received a new order from customer ${customerEmail}\nProduct: ${savedOrder.cartItems
                  .filter((item) => item.brandId?.toString() === brandId)
                  .map((item) => item.name)
                  .join(", ")}\nTotal Price: ${Number(
                  savedOrder.total
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}E£.`,
                brandId,
                orderId: savedOrder._id,
                read: false,
              });

              await newNotification.save();
            }

            const brandNamesMap = {};
            for (const item of savedOrder.cartItems) {
              if (!brandNamesMap[item.brandId]) {
                const brand = await Brand.findById(item.brandId);
                brandNamesMap[item.brandId] =
                  brand?.brandName || "Unknown Brand";
              }
            }

            const adminNotification = new AdminNotification({
              type: "order",
              description: `New order #${
                savedOrder._id
              } created by ${customerEmail} for E£${Number(
                savedOrder.total
              ).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}. Products: ${savedOrder.cartItems
                .map((item) => item.name)
                .join(", ")} from brands: ${[
                ...new Set(Object.values(brandNamesMap)),
              ].join(", ")}`,
              read: false,
            });

            await adminNotification.save();
          } catch (notificationError) {
            console.error("Error creating notifications:", notificationError);
          }
          // === Notification Logic End ===d
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

          // Update quotation status if any cart item has a quotationId
          for (const item of savedOrder.cartItems) {
            if (item.quotationId) {
              await Quotation.findByIdAndUpdate(item.quotationId, {
                status: "approved",
              });
            }
          }

          // Update quotation paymentDetails.paid if any cart item has a quotationId
          for (const item of savedOrder.cartItems) {
            if (item.quotationId) {
              await Quotation.findByIdAndUpdate(item.quotationId, {
                $set: { "paymentDetails.paid": true },
              });
            }
          }

          try {
            // Read the HTML template
            const templatePath = path.join(
              __dirname,
              "../templates/order-receipt-template.html"
            );
            let template = fs.readFileSync(templatePath, "utf8");

            // Helper to fill template for Mailchimp-style placeholders
            function fillOrderTemplate(template, order) {
              // Build products HTML (table or list)
              const productsHtml = order.cartItems
                .map(
                  (item) =>
                    `<li>${item.name} x${item.quantity} — ${item.totalPrice} E£</li>`
                )
                .join("");

              // Build shipping address
              const shipping = order.shippingDetails;
              const shippingAddress = `${shipping.firstName} ${shipping.lastName}<br>${shipping.address}<br>${shipping.city}, ${shipping.country}`;

              // Format order date
              const orderDate = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString()
                : new Date().toLocaleDateString();

              // Replace Mailchimp-style placeholders
              return template
                .replace(/\*\|ORDER_NUMBER\|\*/g, order._id)
                .replace(/\*\|ORDER_ITEMS\|\*/g, productsHtml)
                .replace(/\*\|ORDER_TOTAL\|\*/g, order.total)
                .replace(
                  /\*\|ORDER_SUBTOTAL\|\*/g,
                  order.subtotal || order.total
                )
                .replace(/\*\|ORDER_SHIP_TOTAL\|\*/g, order.shippingFee || 0)
                .replace(/\*\|ORDER_TAX_TOTAL\|\*/g, order.tax || 0)
                .replace(/\*\|ORDER_DATE\|\*/g, orderDate)
                .replace(/\*\|SHIPPING_ADDRESS\|\*/g, shippingAddress)
                .replace(/\*\|MC_PREVIEW_TEXT\|\*/g, "Thanks for your order!");
            }

            const htmlBody = fillOrderTemplate(template, savedOrder);

            await sendEmail({
              to: savedOrder.billingDetails.email,
              subject: "Your Order Receipt - The Design Grit",
              body: htmlBody,
            });
          } catch (emailErr) {
            console.error("Failed to send receipt email:", emailErr);
          }
          // Redirect to success page with the order ID
          return res.redirect(
            `https://thedesigngrit.com/checkout?order=${savedOrder._id}&status=success`
          );
        } catch (error) {
          console.error("Error creating order:", error);
          return res.redirect("https://thedesigngrit.com/home?payment-failed");
        }
      } else {
        console.log("Payment failed via GET, redirecting to failure page");
        return res.redirect("https://thedesigngrit.com/home?payment-failed");
      }
    } catch (error) {
      console.error("Error handling GET callback:", error);
      return res.redirect("https://thedesigngrit.com/home?payment-failed");
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
