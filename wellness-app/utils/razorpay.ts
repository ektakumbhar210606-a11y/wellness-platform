// Define the Razorpay options interface
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  handler?: (response: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: {
    [key: string]: string;
  };
  theme?: {
    color?: string;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Load Razorpay script dynamically
export const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if Razorpay script is already loaded
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve();
      } else {
        reject(new Error('Razorpay SDK failed to load'));
      }
    };
    script.onerror = () => {
      reject(new Error('Razorpay SDK failed to load'));
    };

    document.head.appendChild(script);
  });
};

// Export Razorpay interface for use
export type { RazorpayOptions };