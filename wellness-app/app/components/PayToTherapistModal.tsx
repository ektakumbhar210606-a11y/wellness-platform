'use client';

import { useState, useEffect } from 'react';
import { loadRazorpayScript } from '@/utils/razorpay';

interface PayToTherapistModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  therapistName: string;
  therapistContact: string;
  therapistPaymentAmount: number;
  onPaymentSuccess: (data: any) => void;
  onPaymentFailure: (error: any) => void;
}

const PayToTherapistModal = ({
  isOpen,
  onClose,
  bookingId,
  therapistName,
  therapistContact,
  therapistPaymentAmount,
  onPaymentSuccess,
  onPaymentFailure
}: PayToTherapistModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
    }
  }, [isOpen]);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch order details from backend
      const response = await fetch('/api/business/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          bookingId,
          amount: Math.round(therapistPaymentAmount * 100), // Convert to paise
          currency: 'INR'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const { data } = await response.json();
      const { orderId } = data;

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Should be stored in environment variables
        amount: Math.round(therapistPaymentAmount * 100), // Amount in paise
        currency: 'INR',
        name: 'Wellness Platform',
        description: `Payment to ${therapistName}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Verify payment with backend
            const verifyResponse = await fetch('/api/business/pay-to-therapist', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                bookingId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.error || 'Payment verification failed');
            }

            const verifyResult = await verifyResponse.json();
            onPaymentSuccess(verifyResult);
            onClose();
          } catch (err: any) {
            console.error('Payment verification error:', err);
            onPaymentFailure(err);
          }
        },
        prefill: {
          name: therapistName,
          contact: therapistContact
        },
        theme: {
          color: '#3b82f6'
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err: any) {
      console.error('Payment initialization error:', err);
      setError(err.message || 'An error occurred while initializing payment');
      onPaymentFailure(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Pay to Therapist</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="font-medium">Therapist:</span>
            <span>{therapistName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Contact:</span>
            <span>{therapistContact}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Amount to Pay:</span>
            <span className="font-semibold">₹{(therapistPaymentAmount).toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-600">
              <span>40% of service amount:</span>
              <span>₹{(therapistPaymentAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing...' : `Pay ₹${therapistPaymentAmount.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayToTherapistModal;