import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
// console.log("consumerKey" ,consumerKey)
const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
// console.log("consumer secret",consumerSecret)
const url = process.env.PESAPAL_AUTH_URL;
const ipnurl = process.env.PESAPAL_DEMO_URL;


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
	  console.log("Here is your token",response.data.token);
	  return response.data.token;
	} catch (error) {
	  console.log("error ocurred while getting token", error);
	}
  };
  export default getAccessToken

// Step 1: Get OAuth token
// async function getAccessToken() {
// 	try {
// 		const response = await axios.post(
// 			"https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken", // Sandbox URL
// 			{},
// 			{
// 				headers: {
// 					"Content-Type": "application/json",
// 					"accept": "application/json",
// 					"Authorization": `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
// 				},
// 			}
// 		);

// 		if (response.data.token) {
// 			console.log("token gotten",response.data.token);
// 			return response.data.token;
// 		} else {
// 			console.log("token not found",error.message)
// 			throw new Error("Token not found in the response");

// 		}
// 	} catch (error) {
// 		console.error("Error getting PesaPal access token:", error.message);
// 		throw error;
// 	}
// }

// const getAccessToken = async(req,res)=>{
// 	console.log("token has been requested")
// 		try {
// 		const response = await axios.post(
// 			"https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken", // Sandbox URL
// 			{},
// 			{
// 				headers: {
// 					"Content-Type": "application/json",
// 					"accept": "application/json",
// 					"Authorization": `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
// 				},
// 			}
// 		);
// 		console.log({
// 			consumerKey,
// 			consumerSecret,
// 			authHeader: `Basic ${encodedCredentials}`
// 		  });
		  

// 		if (response.data.token) {
// 			console.log("token gotten",response.data.token);
// 			return response.data.token;
// 		} else {
// 			console.log("token not found",error.message)
// 			throw new Error("Token not found in the response");

// 		}
// 	} catch (error) {
// 		console.error("Error getting PesaPal access token:", error.message);
// 		throw error;
// 	}
// }

// export default getAccessToken;
