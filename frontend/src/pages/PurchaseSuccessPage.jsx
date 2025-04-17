import { ArrowRight, CheckCircle, HandHeart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios";
import Confetti from "react-confetti";

const PurchaseSuccessPage = () => {
	const [isProcessing, setIsProcessing] = useState(true);
	const [error, setError] = useState(null);
	const [paymentInfo, setPaymentInfo] = useState(null);
	const { clearCart } = useCartStore();

	useEffect(() => {
		const fetchPaymentInfo = async () => {
			const orderTrackingId = new URLSearchParams(window.location.search).get("orderTrackingId");

			if (!orderTrackingId) {
				setError("No order tracking ID found in the URL");
				setIsProcessing(false);
				return;
			}

			try {
				const res = await axios.get(`/payments/status?orderTrackingId=${orderTrackingId}`);
				setPaymentInfo(res.data);
				console.log("Next is to clear the cart",res.data)
				clearCart();
				console.log("Cart cleared...")

			} catch (error) {
				console.error("Error fetching payment info:", error);
				setError("Failed to fetch payment details");
			} finally {
				setIsProcessing(false);
			}
		};

		fetchPaymentInfo();
	}, [clearCart]);

	if (isProcessing) return <div className="text-white text-center mt-10">Processing your payment...</div>;
	if (error) return <div className="text-red-500 text-center mt-10">Error: {error}</div>;
	if (!paymentInfo) return <div className="text-white text-center mt-10">No payment info found.</div>;

	return (
		<div className='h-screen flex items-center justify-center px-4'>
			<Confetti
				width={window.innerWidth}
				height={window.innerHeight}
				gravity={0.1}
				style={{ zIndex: 99 }}
				numberOfPieces={700}
				recycle={false}
			/>

			<div className='max-w-md w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden relative z-10'>
				<div className='p-6 sm:p-8'>
					<div className='flex justify-center'>
						<CheckCircle className='text-emerald-400 w-16 h-16 mb-4' />
					</div>
					<h1 className='text-2xl sm:text-3xl font-bold text-center text-emerald-400 mb-2'>
						Purchase Successful!
					</h1>

					<p className='text-gray-300 text-center mb-2'>
						Thank you for your order. {"We're"} processing it now.
					</p>
					

					<div className='bg-gray-700 rounded-lg p-4 mb-6'>
						
						<div className='flex items-center justify-between mb-2'>
							<span className='text-sm text-gray-400'>Confirmation Code</span>
							<span className='text-sm font-semibold text-emerald-400'>
								{paymentInfo.confirmationCode}
							</span>
						</div>
						<div className='flex items-center justify-between mb-2'>
							<span className='text-sm text-gray-400'>Payment Method</span>
							<span className='text-sm font-semibold text-emerald-400'>
								{paymentInfo.paymentMethod}
							</span>
						</div>
						<div className='flex items-center justify-between mb-2'>
							<span className='text-sm text-gray-400'>Phone Number</span>
							<span className='text-sm font-semibold text-emerald-400'>
								{paymentInfo.paymentAccount}
							</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-gray-400'>Amount Paid</span>
							<span className='text-sm font-semibold text-emerald-400'>
								KES {paymentInfo.amount}
							</span>
						</div>
					</div>

					<div className='space-y-4'>
						<button className='w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center'>
							<HandHeart className='mr-2' size={18} />
							Thanks for trusting us!
						</button>
						<Link
							to={"/"}
							className='w-full bg-gray-700 hover:bg-gray-600 text-emerald-400 font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center justify-center'
						>
							Continue Shopping
							<ArrowRight className='ml-2' size={18} />
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PurchaseSuccessPage;
