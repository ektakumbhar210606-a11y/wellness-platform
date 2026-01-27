import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for the ServiceCategory document
export interface IServiceCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the ServiceCategory schema
const ServiceCategorySchema: Schema<IServiceCategory> = new Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Category slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [100, 'Category slug cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  collection: 'servicecategories' // Explicitly specify collection name
});

// Create indexes for better query performance
ServiceCategorySchema.index({ name: 'text' }); // Text index for name search
ServiceCategorySchema.index({ isActive: 1 }); // Index on isActive for filtering
ServiceCategorySchema.index({ createdAt: -1 }); // Index on createdAt for sorting

// Create and export the ServiceCategory model
const ServiceCategoryModel = mongoose.models.ServiceCategory || mongoose.model<IServiceCategory>('ServiceCategory', ServiceCategorySchema);

export default ServiceCategoryModel;