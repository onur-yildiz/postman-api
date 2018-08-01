const mongoose = require('mongoose');
require('./../config/config');

mongoose.connect(
  process.env.MONGODB_URI,
  { useNewUrlParser: true },
  err => {
    if (err) {
      console.log('Unable to connect to MongoDB server.');
    }
  }
);
