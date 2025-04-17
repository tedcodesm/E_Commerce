// models/Transaction.js
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  email: {
    type: String, // ✅ ensure this is a plain string, not an ObjectId
    required: true,
  },
  orderTrackingId: {
    type: String,
    required: true,
    unique: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  confirmationcode: {
    type: String,
    required: true,
  },
  paymentaccount: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },


});

const transaction = mongoose.model("Transaction", transactionSchema);

export default transaction;
