const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  _id: String,
  name: String,
  blackTriplePoints: String,
});

module.exports = mongoose.model('User', userSchema);
