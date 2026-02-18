import mongoose, { Schema, Document } from 'mongoose';
import { IBooking } from './Booking'; // Import the Booking interface

// Define the possible payment methods
export enum PaymentMethod {
  CreditCard = 'credit_card',
  DebitCard = 'debit_card',
  Cash = 'cash',
  PayPal = 'paypal',
  BankTransfer = 'bank_transfer',
  MobileWallet = 'mobile_wallet'
}

// Define the possible status values for a payment
export enum PaymentStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
  Refunded = 'refunded'
}

// Define the interface for the Payment document
export interface IPayment extends Document {
  booking: IBooking['_id'] | IBooking; // Reference to Booking model
  amount: number; // Payment amount (advance portion)
  totalAmount: number; // Total service amount
  advancePaid: number; // Amount paid as advance
  remainingAmount: number; // Remaining amount to be paid at venue
  paymentType: 'FULL' | 'ADVANCE'; // Type of payment
  method: PaymentMethod; // Payment method
  status: PaymentStatus; // Status of the payment
  paymentDate?: Date; // Date when payment was processed (optional)
  createdAt: Date;
  updatedAt: Date;
}

// Define the Payment schema
const PaymentSchema: Schema<IPayment> = new Schema({
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking reference is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  advancePaid: {
    type: Number,
    required: [true, 'Advance paid amount is required'],
    min: [0, 'Advance paid amount cannot be negative']
  },
  remainingAmount: {
    type: Number,
    required: [true, 'Remaining amount is required'],
    min: [0, 'Remaining amount cannot be negative']
  },
  paymentType: {
    type: String,
    required: [true, 'Payment type is required'],
    enum: {
      values: ['FULL', 'ADVANCE'],
      message: 'Payment type must be either FULL or ADVANCE'
    },
    default: 'FULL'
  },
  method: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: Object.values(PaymentMethod),
      message: 'Payment method must be credit_card, debit_card, cash, paypal, bank_transfer, or mobile_wallet'
    }
  },
  status: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: {
      values: Object.values(PaymentStatus),
      message: 'Status must be either pending, completed, failed, or refunded'
    },
    default: PaymentStatus.Pending
  },
  paymentDate: {
    type: Date,
    default: Date.now // Default to current date if not provided
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create indexes for better query performance
PaymentSchema.index({ booking: 1 }); // Index on booking for quick lookups by booking
PaymentSchema.index({ amount: 1 }); // Index on amount for amount-based queries
PaymentSchema.index({ method: 1 }); // Index on method for filtering by payment method
PaymentSchema.index({ status: 1 }); // Index on status for filtering by payment status
PaymentSchema.index({ paymentDate: 1 }); // Index on payment date for date-based queries

// Create and export the Payment model
const PaymentModel = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default PaymentModel;