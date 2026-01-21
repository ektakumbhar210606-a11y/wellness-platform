import mongoose, { Schema, Document } from 'mongoose';
import { IBusiness } from './Business'; // Import the Business interface
import { ITherapist } from './Therapist'; // Import the Therapist interface

// Define the interface for the Service document
export interface IService extends Document {
  business: IBusiness['_id'] | IBusiness; // Reference to Business model
  name: string; // Service name
  price: number; // Service price
  duration: number; // Duration in minutes
  description?: string; // Optional service description
  category?: string; // Optional service category
  therapists?: ITherapist['_id'][] | ITherapist[]; // Array of therapist references
  createdAt: Date;
  updatedAt: Date;
}

// Define the Service schema
const ServiceSchema: Schema<IService> = new Schema({
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Business reference is required'],
  },
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  therapists: [{
    type: Schema.Types.ObjectId,
    ref: 'Therapist'
  }]
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create indexes for better query performance
ServiceSchema.index({ business: 1 }); // Index on business for quick lookups by business
ServiceSchema.index({ name: 'text' }); // Text index for service name search
ServiceSchema.index({ price: 1 }); // Index on price for sorting/filtering
ServiceSchema.index({ duration: 1 }); // Index on duration for sorting/filtering
ServiceSchema.index({ category: 1 }); // Index on category for filtering
ServiceSchema.index({ therapists: 1 }); // Index on therapists for marketplace queries

// Create and export the Service model
const ServiceModel = mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);

export default ServiceModel;