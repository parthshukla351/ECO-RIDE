const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Phone must be 10 digits']
  },
  role: {
    type: String,
    enum: ['passenger', 'driver', 'admin'],
    default: 'passenger'
  },
  avatar: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png'
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },

  // Verification
  isVerified: { type: Boolean, default: false },
  otp: String,
  otpExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Account Status
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  banReason: String,
  isOnline: { type: Boolean, default: false },
  lastSeen: Date,
  lastLogin: Date,

  // Driver specific
  vehicleDetails: {
    make: { type: String },
    model: { type: String },
    year: { type: Number },
    color: { type: String },
    licensePlate: { type: String },
    vehicleType: {
      type: String,
      enum: ['petrol', 'diesel', 'hybrid', 'electric'],
      default: 'petrol'
    },
    seatingCapacity: { type: Number, default: 4 }
  },
  driverLicense: {
    number: String,
    verified: { type: Boolean, default: false },
    image: String
  },
  isDriverVerified: { type: Boolean, default: false },

  // Eco Stats
  totalRides: { type: Number, default: 0 },
  completedRides: { type: Number, default: 0 },
  cancelledRides: { type: Number, default: 0 },
  totalCO2Saved: { type: Number, default: 0 },
  totalDistanceTravelled: { type: Number, default: 0 },

  // Eco Rewards
  ecoPoints: { type: Number, default: 100 }, // Welcome bonus
  ecoLevel: {
    type: String,
    enum: ['Seedling', 'Sprout', 'Tree', 'Forest', 'EcoHero'],
    default: 'Seedling'
  },
  ecoBadges: [{ type: String }],

  // Safety & Trust
  safetyScore: { type: Number, default: 75 },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  cancellationCount: { type: Number, default: 0 },

  // Preferences
  preferences: {
    womenOnly: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false }
  },

  // Social
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCount: { type: Number, default: 0 },

}, { timestamps: true });

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1, isBanned: 1 });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate referral code before save
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = 'ECO' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update eco level based on points
userSchema.methods.updateEcoLevel = function() {
  if (this.ecoPoints >= 5000) this.ecoLevel = 'EcoHero';
  else if (this.ecoPoints >= 2000) this.ecoLevel = 'Forest';
  else if (this.ecoPoints >= 1000) this.ecoLevel = 'Tree';
  else if (this.ecoPoints >= 500) this.ecoLevel = 'Sprout';
  else this.ecoLevel = 'Seedling';
};

// Add eco points and update level
userSchema.methods.addEcoPoints = async function(points) {
  this.ecoPoints += points;
  this.updateEcoLevel();
  await this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', userSchema);