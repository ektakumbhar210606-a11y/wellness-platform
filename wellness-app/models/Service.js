const mongoose = require('mongoose');

// Define the Service schema
const ServiceSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Business reference is required'],
  },
  serviceCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    required: [true, 'Service category is required'],
  },
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [200, 'Service name cannot exceed 200 characters']
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Therapist'
  }],
  teamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
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
const ServiceModel = mongoose.models.Service || mongoose.model('Service', ServiceSchema);

module.exports = ServiceModel;
