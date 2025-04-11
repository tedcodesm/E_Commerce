import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js"
import productRoutes from "./routes/product.route.js"
import cartRoutes from "./routes/cart.route.js"
import couponRoutes from "./routes/coupon.route.js"
import paymentRoutes from "./routes/payment.route.js"
import analyticsRoutes from "./routes/analytics.route.js"
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import path from "path"

dotenv.config()

const app = express();
const PORT = process.env.PORT

const __dirname = path.resolve()


app.use(express.json({limit: "10mb"})) 
app.use(cookieParser( ))
app.use('/api/auth', authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/coupons", couponRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/analytics", analyticsRoutes)
app.post("/api/payment/pesapal-ipn", (req, res) => {
    console.log("📬 IPN Notification received:", req.body);
    
    // Handle the IPN here (e.g., update order status in DB)
    // You can also validate the IPN by checking if it matches a signature or a known reference.
 
    // Respond with a success message to acknowledge receipt of the IPN
    res.status(200).send("IPN received and processed");
 });

if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname,"/frontend/dist")));

    app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

app.listen(PORT , () =>{
    console.log(`server is running on port ${PORT}`);

    connectDB();
})