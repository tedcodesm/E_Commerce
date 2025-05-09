import axios from "axios";
import crypto from "crypto";
import getAccessToken from "../lib/pesapal.js";
import Coupon from "../models/coupon.model.js";
import dotenv from "dotenv";
import { saveTransactionToDB } from "../lib/savetransaction.js";
import User from "../models/user.model.js";

dotenv.config();

const ipnurl = process.env.PESAPAL_DEMO_URL;
const url = process.env.PESAPAL_AUTH_URL;
const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
// console.log("consumerKey" ,consumerKey)
const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
// console.log("consumer secret",consumerSecret)

export const createPesapalPaymentSession = async (req, res) => {
  console.log("trying to do the payment");
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty products array" });
    }

    let totalAmount = 0;
    products.forEach((product) => {
      totalAmount += product.price * product.quantity;
    });

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode,
        userId: req.user._id,
        isActive: true,
      });
      if (coupon) {
        totalAmount -= (totalAmount * coupon.discountPercentage) / 100;
      }
    }

    const orderRef = crypto.randomUUID();
    // const ipnNotificationUrl ="https://3a76-41-209-60-99.ngrok-free.app/api/payment/pesapal-ipn";
    const ipnNotificationUrl = "https://ecommerce-vtt3.onrender.com/api/payment/pesapal-ipn";
    // const callbackurl = `https://3a76-41-209-60-99.ngrok-free.app/api/payments/pesapal-callback?orderRef=${orderRef}&email=${req.user.email}`;
    const callbackurl = `https://ecommerce-vtt3.onrender.com/api/payments/pesapal-callback?orderRef=${orderRef}&email=${req.user.email}`

    const getAccessToken = async (req, res) => {
      console.log("Token has been requested");
      try {
        const headers = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };
        const body = {
          consumer_key: consumerKey,
          consumer_secret: consumerSecret,
        };

        //handle request
        const response = await axios.post(url, body, { headers });

        const accessToken = response.data.token;
        console.log("Here is your token", response.data.token);
        return response.data.token;
      } catch (error) {
        console.log("error ocurred while getting token", error);
      }
    };

    const registerIPN = async (accessToken) => {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      const body = {
        url: ipnNotificationUrl,
        ipn_notification_type: "POST",
      };
      const response = await axios.post(ipnurl, body, { headers });
      console.log("IPN registered successfully", response.data);
      return response.data.ipn_id;
    };

    const accessToken = await getAccessToken();
    const myipn_id = await registerIPN(accessToken);

    const body = {
      id: orderRef,
      currency: "KES",
      amount: totalAmount.toFixed(2),
      description: "Order payment",
      callback_url: callbackurl,
      notification_id: myipn_id,
      billing_address: {
        email_address: req.user.email,
        phone_number: req.user.phone || "0700000000",
        first_name: req.user.name?.split(" ")[0] || "Customer",
        last_name: req.user.name?.split(" ")[1] || " ",
      },
    };

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const response = await axios.post(
      "https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest",
      body,
      { headers }
    );

    console.log("PesaPal Order Submitted:", response.data);
    if (totalAmount >= 2000) {
      await createNewCoupon(req.user._id);
    }

    return res.status(200).json({
      redirectUrl: response.data.redirect_url,
      orderTrackingId: response.data.order_tracking_id,
    });
  } catch (error) {
    console.error(
      "PesaPal Payment Error:",
      error.response?.data || error.message
    );
    res
      .status(500)
      .json({
        message: "Failed to initiate PesaPal payment",
        error: error.message,
      });
  }
};

export const handlePesapalCallback = async (req, res) => {
  try {
    const orderTrackingId = req.query.OrderTrackingId;
    const orderRef = req.query.orderRef;
    const email = req.query.email;

    if (!orderTrackingId || !orderRef) {
      return res.status(400).send("Missing required query parameters");
    }

    const accessToken = await getAccessToken();
  
	await  getTransactionStatus (accessToken,orderTrackingId,res,email);
  } catch (error) {
    console.error("PesaPal Callback Error:", error);
    res.status(500).send("Callback Error");
  }
};

const getTransactionStatus = async (accessToken, orderTrackingId, res ,email  ) => {
  try {
    const result = await axios.get(
      `https://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("transaction status",result.data)

    const status = result.data.payment_status_description || result.data.status;
    await saveTransactionToDB({
      orderTrackingId,
      confirmationcode: result.data.confirmation_code,
      status: result.data.payment_status_description,
      paymentMethod: result.data.payment_method,
      paymentaccount: result.data.payment_account,
      amount: result.data.amount,
      createdAt: result.data.created_at,
      email,
      
    });

    if (status && status.toLowerCase() === "completed") {
      return res.redirect(`${process.env.CLIENT_URL}/purchase-success?orderTrackingId=${orderTrackingId}`);
    } else {
      return res.redirect(`${process.env.CLIENT_URL}/purchase-cancel`);
    }
  } catch (error) {
    console.error("Error getting transaction status:", error.message);
    return res.status(500).json({ message: "Error verifying transaction" });
  }
};

