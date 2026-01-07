import mongoose, { Schema, Document } from 'mongoose';

// Define the possible roles for a user
export enum UserRole {
  Customer = 'Customer',
  Business = 'Business',
  Therapist = 'Therapist'
}

// Define the interface for the User document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Define the phone validation regex (simplified for international numbers)
const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;

// Define the User schema
const UserSchema: Schema<IUser> = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true, // This creates an index
    trim: true,
    lowercase: true,
    maxlength: [255, 'Email cannot exceed 255 characters'],
    validate: {
      validator: (value: string) => emailRegex.test(value),
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't return the password by default when querying
  },
  role: {
    type: String,
    enum: {
      values: Object.values(UserRole),
      message: 'Role must be either Customer, Business, or Therapist'
    },
    default: UserRole.Customer
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: (value: string) => !value || phoneRegex.test(value),
      message: 'Please provide a valid phone number'
    }
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create and export the User model
const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default UserModel;