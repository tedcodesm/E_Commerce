import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import Coupon from "../models/coupon.model.js";
import { stripe } from "../lib/stripe.js";
import { createPesapalPaymentSession, handlePesapalCallback } from "../controllers/payment.controller.js";
import getAccessToken from "../lib/pesapal.js";
import axios from "axios";
const router = express.Router();
router.use(express.json());
router.use(express.urlencoded({extended:true}));

// router.post("/create-checkout-session",protectRoute,createCheckoutSession)
// router.post("/checkout-success",protectRoute,checkoutSuccess)
router.post("/create-pesapal-session", protectRoute, createPesapalPaymentSession);
router.get("/pesapal-callback", handlePesapalCallback);
router.get('/status', async (req, res) => {
    const { orderTrackingId } = req.query;  // Grab orderTrackingId from query string
  
    if (!orderTrackingId) {
      return res.status(400).json({ error: "orderTrackingId is required" });
    }
  
    try {
        const accessToken = await getAccessToken(); // ✅ dynamically fetch token

      // Make a request to Pesapal API (or your payment gateway)
      const response = await axios.get(`https://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Add your access token
        },
      });
  
      // Assuming the response from Pesapal has the following structure
      const paymentData = response.data;
  
      // Send the data back to the frontend
      return res.status(200).json({
        orderTrackingId: paymentData.order_tracking_id,
        merchantReference: paymentData.merchant_reference,
        confirmationCode: paymentData.confirmation_code,
        paymentStatus: paymentData.payment_status_description,
        paymentMethod: paymentData.payment_method,
        amount: paymentData.amount,
        paymentAccount: paymentData.payment_account,
      });
    } catch (err) {
      console.error("Error fetching payment status:", err);
      return res.status(500).json({ error: "Failed to fetch payment details" });
    }
  });



export default router