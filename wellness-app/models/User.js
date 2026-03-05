const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  rewardPoints: {
    type: Number,
    default: 0,
    max: 100,
    min: 0,
    validate: {
      validator: function(value) {
        return value >= 0 && value <= 100;
      },
      message: 'Reward points must be between 0 and 100'
    }
  },
  rewardHistory: [{
    type: {
      type: String,
      enum: ['REVIEW_REWARD', 'DISCOUNT_USED'],
      required: true
    },
    points: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries on reward points
userSchema.index({ rewardPoints: -1 });

const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = UserModel;
