import transaction from "../models/transaction.model.js";

export const saveTransactionToDB = async (transactionData) => {
  const {
    orderTrackingId,
    status,
    paymentMethod,
    confirmationcode,
    paymentaccount,
    amount,
    email,
    createdAt,
  } = transactionData;

  try {
    const existing = await transaction.findOne({ orderTrackingId });
    if (existing) {
      console.log("Transaction already exists in DB");
      return;
    }


    await transaction.create({
      email,
      orderTrackingId,
      confirmationcode,
      paymentMethod,
      paymentaccount,
      status,
      amount,
      createdAt: new Date(createdAt || Date.now()),
    });

    console.log("Transaction saved to DB ");
  } catch (error) {
    console.error("Error saving transaction:", error.message);
  }
};
