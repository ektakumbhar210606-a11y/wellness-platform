import mongoose, { Schema, Document } from 'mongoose';
import { IBusiness } from './Business'; // Import the Business interface
import { ITherapist } from './Therapist'; // Import the Therapist interface
import { IServiceCategory } from './ServiceCategory'; // Import the ServiceCategory interface

// Define the interface for the Service document
export interface IService extends Document {
  business: IBusiness['_id'] | IBusiness; // Reference to Business model
  serviceCategory: IServiceCategory['_id'] | IServiceCategory; // Reference to ServiceCategory model
  price: number; // Service price
  duration: number; // Duration in minutes
  description?: string; // Optional service description
  therapists?: ITherapist['_id'][] | ITherapist[]; // Array of therapist references
  teamMembers?: ITherapist['_id'][] | ITherapist[]; // Array of team member references
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
  serviceCategory: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    required: [true, 'Service category is required'],
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

  therapists: [{
    type: Schema.Types.ObjectId,
    ref: 'Therapist'
  }],
  teamMembers: [{
    type: Schema.Types.ObjectId,
    ref: 'Therapist'
  }]
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create indexes for better query performance
ServiceSchema.index({ business: 1 }); // Index on business for quick lookups by business
ServiceSchema.index({ serviceCategory: 1 }); // Index on serviceCategory for filtering
ServiceSchema.index({ price: 1 }); // Index on price for sorting/filtering
ServiceSchema.index({ duration: 1 }); // Index on duration for sorting/filtering

ServiceSchema.index({ therapists: 1 }); // Index on therapists for marketplace queries
ServiceSchema.index({ teamMembers: 1 }); // Index on team members for marketplace queries

// Create and export the Service model
const ServiceModel = mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);

export default ServiceModel;