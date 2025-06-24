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
const TempOrder = require("../models/tempOrder");

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
        total: orderData.total,
        customerId: orderData.customerId || req.user?.id,
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
                : item.price || 0,
              brandId: item.brandId,
            }))
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

      // Save temp order in DB
      await TempOrder.create({
        paymobOrderId: paymobOrder.id,
        transformedOrderData,
      });

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
          const tempOrder = await TempOrder.findOne({
            paymobOrderId: Number(orderId),
          });
          const orderData = tempOrder ? tempOrder.transformedOrderData : {};
          console.log(
            "Transformed order data in handle callback:",
            JSON.stringify(orderData, null, 2)
          );
          // --- Quotation Payment ---
          if (orderExtras.quotationId) {
            const Quotation = require("../models/quotation");
            const quotation = await Quotation.findById(orderExtras.quotationId)
              .populate("userId")
              .populate("brandId")
              .populate("productId");
            if (!quotation) {
              return res.redirect(
                "https://thedesigngrit.com/home?payment-failed"
              );
            }
            // Mark payment as successful in the quotation
            await Quotation.findByIdAndUpdate(quotation._id, {
              $set: {
                paymentDetails: {
                  paid: true,
                  paymentId: orderId,
                  paymentMethod: "paymob",
                },
              },
            });
            // Create an Order for this paid quotation
            const customerId = quotation.userId._id
              ? quotation.userId._id
              : quotation.userId;
            const newOrder = new Order({
              customerId,
              cartItems: [
                {
                  productId: quotation.productId._id || quotation.productId,
                  name: quotation.productId.name || "Product",
                  quantity: 1,
                  price: quotation.quotePrice,
                  totalPrice: quotation.quotePrice,
                  brandId: quotation.brandId._id || quotation.brandId,
                },
              ],
              subtotal: quotation.quotePrice,
              shippingFee: 0,
              total: quotation.quotePrice,
              orderStatus: "Pending",
              paymentDetails: {
                paymentMethod: "paymob",
                transactionId: orderId,
                paymentStatus: "Paid",
              },
              billingDetails: {
                firstName: quotation.userId.firstName || "",
                lastName: quotation.userId.lastName || "",
                email: quotation.userId.email || "",
                phoneNumber: quotation.userId.phoneNumber || "",
                address:
                  quotation.userId.address &&
                  quotation.userId.address.trim() !== ""
                    ? quotation.userId.address
                    : "NA",
                country: quotation.userId.country || "NA",
                city: quotation.userId.city || "NA",
                zipCode: quotation.userId.zipCode || "NA",
              },
              shippingDetails: {
                firstName: quotation.userId.firstName || "",
                lastName: quotation.userId.lastName || "",
                address:
                  quotation.userId.address &&
                  quotation.userId.address.trim() !== ""
                    ? quotation.userId.address
                    : "NA",
                phoneNumber: quotation.userId.phoneNumber || "",
                country: quotation.userId.country || "NA",
                city: quotation.userId.city || "NA",
                zipCode: quotation.userId.zipCode || "NA",
              },
            });
            await newOrder.save();
            return res.redirect(
              `https://thedesigngrit.com/checkout?order=${newOrder._id}&status=success`
            );
          }

          // --- Regular Order Payment ---
          let customerId = orderData.customerId || orderExtras.customerId;
          if (customerId && typeof customerId === "object" && customerId._id) {
            customerId = customerId._id;
          }
          // Fallback: try to get from billingDetails email if still missing
          if (!customerId) {
            const email =
              (orderData.billingDetails && orderData.billingDetails.email) ||
              (orderExtras.billingDetails && orderExtras.billingDetails.email);
            if (email) {
              const foundUser = await user.findOne({ email });
              if (foundUser) {
                customerId = foundUser._id;
              }
            }
          }
          if (!customerId) {
            // Handle error: cannot create order without customerId
            console.error("Could not determine customerId for order creation");
            return res.redirect(
              "https://thedesigngrit.com/home?payment-failed"
            );
          }

          // Create a new order in your database
          const newOrder = new Order({
            customerId,
            cartItems: orderData.cartItems
              ? orderData.cartItems.map((item) => ({
                  productId: item.productId,
                  variantId: item.variantId,
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price || item.totalPrice / item.quantity,
                  totalPrice: item.totalPrice || item.price * item.quantity,
                  brandId: item.brandId,
                }))
              : [],
            subtotal: orderData.total || paymobOrder.amount_cents / 100,
            shippingFee: orderData.shippingFee || orderExtras.shippingFee || 0,
            total: orderData.total || paymobOrder.amount_cents / 100,
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
                country: paymobOrder.shipping_data?.country || "N/A",
                city: paymobOrder.shipping_data?.city || "N/A",
                zipCode: paymobOrder.shipping_data?.postal_code || "N/A",
              },
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
                  .join(", ")}\nTotal Price: ${savedOrder.total}E£.`,
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
              } created by ${customerEmail} for E£${
                savedOrder.total
              }. Products: ${savedOrder.cartItems
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
                .replace(/\*\|SHIPPING_ADDRESS\|\*/g, shippingAddress);
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

  static async createQuotationPayment(req, res) {
    try {
      const { id } = req.params;
      const Quotation = require("../models/quotation");
      const quotation = await Quotation.findById(id)
        .populate("userId")
        .populate("brandId")
        .populate("productId");

      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      if (!quotation.ClientApproval || !quotation.vendorApproval) {
        return res.status(400).json({
          message: "Quotation not approved by both client and vendor",
        });
      }

      if (!quotation.quotePrice) {
        return res
          .status(400)
          .json({ message: "No quote price set for this quotation" });
      }
      // Prepare orderData for Paymob
      const safeAddress =
        quotation.userId.address && quotation.userId.address.trim() !== ""
          ? quotation.userId.address
          : "NA";
      // Prepare minimal orderData for Paymob
      const orderData = {
        total: quotation.quotePrice,
        customerId: quotation.userId._id || quotation.userId,
        billingDetails: {
          firstName: quotation.userId.firstName || "",
          lastName: quotation.userId.lastName || "",
          email: quotation.userId.email || "",
          phoneNumber: quotation.userId.phoneNumber || "",
          address: safeAddress || quotation.billingDetails.address,
          country: quotation.userId.country || "NA",
          city: quotation.userId.city || "NA",
          zipCode: quotation.userId.zipCode || "NA",
        },
        cartItems: [
          {
            productId: quotation.productId._id,
            name: quotation.productId.name || "Product",
            quantity: 1,
            price: quotation.quotePrice,
            totalPrice: quotation.quotePrice,
            brandId: quotation.brandId._id,
          },
        ],
        shippingFee: 0,
        shippingDetails: {
          firstName: quotation.userId.firstName,
          lastName: quotation.userId.lastName,
          address: safeAddress || quotation.shippingDetails.address1,
          phoneNumber: quotation.userId.phoneNumber || "",
          country: quotation.userId.country || "NA",
          city: quotation.userId.city || "NA",
          zipCode: quotation.userId.zipCode || "NA",
        },
      };

      // Create Paymob order
      const { order: paymobOrder, authToken } = await PaymobService.createOrder(
        orderData.total,
        orderData
      );

      // Get payment key
      const paymentKey = await PaymobService.getPaymentKey(
        paymobOrder.id,
        {
          amount: orderData.total,
          email: orderData.billingDetails.email,
          firstName: orderData.billingDetails.firstName,
          lastName: orderData.billingDetails.lastName,
          address: orderData.billingDetails.address,
          phoneNumber: orderData.billingDetails.phoneNumber,
          country: orderData.billingDetails.country,
          city: orderData.billingDetails.city,
          postal_code: orderData.billingDetails.zipCode,
          cartItems: orderData.cartItems,
          customerId: orderData.customerId,
          shippingFee: orderData.shippingFee,
          billingDetails: orderData.billingDetails,
          shippingDetails: orderData.shippingDetails,
        },
        authToken,
        `${
          process.env.API_BASE_URL || "https://api.thedesigngrit.com"
        }/api/paymob/callback`
      );

      // Return iframe URL
      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey.token}`;
      res.json({
        success: true,
        iframe_url: iframeUrl,
        orderId: paymobOrder.id,
        paymentKey: paymentKey.token,
      });
    } catch (error) {
      console.error("Error creating quotation payment:", error);
      res
        .status(500)
        .json({ message: "Error creating quotation payment", error });
    }
  }
}

module.exports = PaymobController;
