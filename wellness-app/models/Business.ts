import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User'; // Import the User interface

// Define the possible status values for a business
export enum BusinessStatus {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended'
}

// Define the interface for the Address subdocument
export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Define the interface for the Business document
export interface IBusiness extends Document {
  owner: IUser['_id'] | IUser; // Reference to User model
  name: string;
  address: IAddress;
  openingTime: string; // In HH:MM format
  closingTime: string; // In HH:MM format
  status: BusinessStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Define the time format validation regex (HH:MM format)
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Define the Business schema
const BusinessSchema: Schema<IBusiness> = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required'],
  },
  name: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters'],
    validate: {
      validator: (value: string) => {
        // Basic validation for business name (alphanumeric, spaces, hyphens, apostrophes)
        const businessNameRegex = /^[a-zA-Z0-9\s\-'\.]+$/;
        return businessNameRegex.test(value);
      },
      message: 'Please provide a valid business name'
    }
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [50, 'City cannot exceed 50 characters']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [50, 'State cannot exceed 50 characters']
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
      trim: true,
      maxlength: [20, 'Zip code cannot exceed 20 characters']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [50, 'Country cannot exceed 50 characters']
    }
  },
  openingTime: {
    type: String,
    required: [true, 'Opening time is required'],
    validate: {
      validator: (value: string) => timeFormatRegex.test(value),
      message: 'Please provide a valid opening time in HH:MM format (24-hour)'
    }
  },
  closingTime: {
    type: String,
    required: [true, 'Closing time is required'],
    validate: {
      validator: (value: string) => timeFormatRegex.test(value),
      message: 'Please provide a valid closing time in HH:MM format (24-hour)'
    }
  },
  status: {
    type: String,
    enum: {
      values: Object.values(BusinessStatus),
      message: 'Status must be either active, inactive, or suspended'
    },
    default: BusinessStatus.Active
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create indexes for better query performance
BusinessSchema.index({ owner: 1 }); // Index on owner for quick lookups
BusinessSchema.index({ name: 'text' }); // Text index for business name search
BusinessSchema.index({ 'address.city': 1 }); // Index on city for location-based queries
BusinessSchema.index({ status: 1 }); // Index on status for filtering

// Create and export the Business model
const BusinessModel = mongoose.models.Business || mongoose.model<IBusiness>('Business', BusinessSchema);

export default BusinessModel;