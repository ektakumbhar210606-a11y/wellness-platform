const mongoose = require('mongoose');

// Define status values
const BusinessStatus = {
  Active: 'active',
  Inactive: 'inactive',
  Suspended: 'suspended'
};

// Define service types
const ServiceType = {
  Massage: 'massage',
  Spa: 'spa',
  Wellness: 'wellness',
  Corporate: 'corporate'
};

// Define therapist association status
const TherapistAssociationStatus = {
  Pending: 'pending',
  Approved: 'approved'
};

// Define the Business schema
const BusinessSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required'],
  },
  name: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters'],
    validate: {
      validator: (value) => {
        const businessNameRegex = /^[a-zA-Z0-9\s\-\'\.]+$/;
        return businessNameRegex.test(value);
      },
      message: 'Please provide a valid business name'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Business description cannot exceed 500 characters']
  },
  serviceType: {
    type: String,
    enum: {
      values: Object.values(ServiceType),
      message: 'Service type must be one of: massage, spa, wellness, corporate'
    }
  },
  serviceName: {
    type: String,
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'],
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    maxlength: [100, 'Email cannot exceed 100 characters']
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/[^\s/$.?#].[^\s]*/i, 'Please provide a valid website URL'],
    maxlength: [200, 'Website URL cannot exceed 200 characters']
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
    },
    currency: {
      type: String,
      trim: true,
      maxlength: [3, 'Currency code cannot exceed 3 characters'],
      default: 'INR'
    }
  },
  openingTime: {
    type: String,
    required: [true, 'Opening time is required'],
    validate: {
      validator: (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value),
      message: 'Please provide a valid opening time in HH:MM format (24-hour)'
    }
  },
  closingTime: {
    type: String,
    required: [true, 'Closing time is required'],
    validate: {
      validator: (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value),
      message: 'Please provide a valid closing time in HH:MM format (24-hour)'
    }
  },
  businessHours: {
    Monday: {
      open: String,
      close: String,
      closed: Boolean
    },
    Tuesday: {
      open: String,
      close: String,
      closed: Boolean
    },
    Wednesday: {
      open: String,
      close: String,
      closed: Boolean
    },
    Thursday: {
      open: String,
      close: String,
      closed: Boolean
    },
    Friday: {
      open: String,
      close: String,
      closed: Boolean
    },
    Saturday: {
      open: String,
      close: String,
      closed: Boolean
    },
    Sunday: {
      open: String,
      close: String,
      closed: Boolean
    }
  },
  status: {
    type: String,
    enum: {
      values: Object.values(BusinessStatus),
      message: 'Status must be either active, inactive, or suspended'
    },
    default: BusinessStatus.Active
  },
  currency: {
    type: String,
    trim: true,
    maxlength: [3, 'Currency code cannot exceed 3 characters'],
    default: 'INR'
  },
  therapists: [{
    therapistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Therapist',
      required: true
    },
    status: {
      type: String,
      enum: {
        values: Object.values(TherapistAssociationStatus),
        message: 'Therapist association status must be pending or approved'
      },
      default: TherapistAssociationStatus.Pending
    },
    joinedAt: {
      type: Date
    }
  }]
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create indexes for better query performance
BusinessSchema.index({ owner: 1 });
BusinessSchema.index({ name: 'text' });
BusinessSchema.index({ 'address.city': 1 });
BusinessSchema.index({ status: 1 });
BusinessSchema.index({ serviceType: 1 });
BusinessSchema.index({ 'therapists.therapistId': 1 });

// Create and export the Business model
const BusinessModel = mongoose.models.Business || mongoose.model('Business', BusinessSchema);

module.exports = BusinessModel;
