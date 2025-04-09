import axios from "axios";
import crypto from "crypto";
import getAccessToken from "../lib/pesapal.js";
import Coupon from "../models/coupon.model.js";
import dotenv from "dotenv";

dotenv.config();

const ipnurl = process.env.PESAPAL_DEMO_URL;
const url = process.env.PESAPAL_AUTH_URL;


export const createPesapalPaymentSession = async (req, res) => {
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
			coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
			if (coupon) {
				totalAmount -= (totalAmount * coupon.discountPercentage) / 100;
			}
		}

		const accessToken = await getAccessToken();
		const orderRef = crypto.randomUUID();


		const registerIPN = async (accessToken) => {
			//   const accessToken = await getToken();
			//   try {
			const headers = {
			  Authorization: `Bearer ${accessToken}`,
			  "Content-Type": "application/json",
			  Accept: "application/json",
			};
			const body = {
			  url: `https://ecommerce-vtt3.onrender.com//api/payment/pesapal-callback?orderRef=${orderRef}`,
			  ipn_notification_type: "POST",
			};
			const response = await axios.post(ipnurl, body, { headers });
			console.log("IPN registered successfully", response.data);
		  
			//   const createddata = response.data.created_date;
			const ipn_id = response.data.ipn_id;
		  
			//   const status = response.data.status;
			await getIpnLists(accessToken);
			return ipn_id;
			//   } catch (error) {
			//     console.log("error occurred while registering IPN", error);
			//   }
		  };


		const requestBody = {
			id: orderRef,
			currency: "KES",
			amount: totalAmount.toFixed(2),
			description: "Order payment",
			callback_url: `https://ecommerce-vtt3.onrender.com//api/payment/pesapal-callback?orderRef=${orderRef}`,
			notification_id: myipn_id, // Optional
			billing_address: {
				email_address: req.user.email,
				phone_number: req.user.phone || "0700000000",
				first_name: req.user.name?.split(" ")[0] || "Customer",
				last_name: req.user.name?.split(" ")[1] || " ",
			},
		};

		console.log(requestBody);
    

		try {
			// Ensure you have the access token
			const accessToken = await getAccessToken();
			//   console.log("token",accessToken)
			//   await registerIPN(accessToken);
			const myipn_id = await registerIPN(accessToken);
			//   console.log('generated',myipn_id)
			//   return
		
			// Define the endpoint URL for order submission
			const orderUrl =
			  "https://cybqa.pesapal.com/pesapalv3/api/Transactions/SubmitOrderRequest";
		
			// Set up the headers
			const headers = {
			  Authorization: `Bearer ${accessToken}`,
			  "Content-Type": "application/json",
			  Accept: "application/json",
			};
		
			console.log("callbackurl",callbackurl);
			const callbackWithUserId = `${callbackurl}?userId=${userId}&planId=${planId}`;
		
			// Prepare the body with order details
			const body = {
			  // Populate these fields with actual data from your application
			  id: requestBody.id, // Unique identifier for the transaction
			  currency: requestBody.currency, // e.g., "KES"
			  amount: requestBody.amount, // e.g., "1000.00"
			  description: requestBody.description, // e.g., "Order payment"
			  callback_url: callbackWithUserId, // Callback URL for notifications
			  notification_id: myipn_id,
			  billing_address: {
				email_address: req.user.email,
				phone_number: req.user.phone || "0700000000",
				first_name: req.user.name?.split(" ")[0] || "Customer",
				last_name: req.user.name?.split(" ")[1] || " ",
			},
			};
		
			// Send the POST request
			const response = await axios.post(orderUrl, body, { headers });
		
			// Log the response data
			console.log("Order submitted successfully", response.data);
			// res.json(response.data);
			console.log("redirect url", response.data.redirect_url);
			// return response.data;
			const paymentresponse = response.data;
			io.to(receiverId).emit("payment-started",paymentresponse);
			return res.status(200).json(response.data);
		  } catch (error) {
			console.log("Error occurred while submitting order", error);
		  };



		const response = await axios.post(
			"https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest",
			requestBody,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
			}
		);

		const redirectUrl = response.data.redirect_url;

		if (totalAmount >= 20000) {
			await createNewCoupon(req.user._id);
		}

		// Optional: Save temporary order metadata
		// e.g. save to DB with status = pending

		res.status(200).json({ redirectUrl });
	} catch (error) {
		console.error("PesaPal Payment Error:", error.response?.data || error.message);
		res.status(500).json({ message: "Failed to initiate PesaPal payment", error: error.message });
	}
};
export const handlePesapalCallback = async (req, res) => {
	try {
		const { orderTrackingId, orderRef } = req.query;

		const accessToken = await getAccessToken();

		const result = await axios.get(
			`https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		if (result.data.status === "COMPLETED") {
			// Optionally get data from DB if orderRef was saved earlier

			// Deactivate coupon
			// await Coupon.findOneAndUpdate(...)

			// Create order
			// await Order.create({ user, products, amount, ... })

			return res.redirect(`${process.env.CLIENT_URL}/purchase-success`);
		} else {
			return res.redirect(`${process.env.CLIENT_URL}/purchase-cancel`);
		}
	} catch (error) {
		console.error("PesaPal Callback Error:", error.message);
		res.status(500).send("Callback Error");
	}
};
