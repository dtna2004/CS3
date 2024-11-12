const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  age: { type: Number },
  gender: { type: String },
  avatar: { type: String },
  occupation: { type: String },
  interests: [String],
  lifestyle: [String],
  goals: [String],
  values: [String],
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema); 