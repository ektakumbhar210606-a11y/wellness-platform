declare module 'razorpay' {
  class Razorpay {
    constructor(options: {
      key_id: string;
      key_secret: string;
    });

    orders: {
      create(params: any): Promise<any>;
      fetch(orderId: string): Promise<any>;
      capturePayment(orderId: string, amount: number): Promise<any>;
    };

    payments: {
      fetch(paymentId: string): Promise<any>;
      capture(paymentId: string, params: any): Promise<any>;
      refund(paymentId: string, params: any): Promise<any>;
    };
  }

  export = Razorpay;
}