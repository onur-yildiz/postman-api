const mongoose = require('mongoose');

const Request = mongoose.model('Request', {
  url: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  date: {
    type: Date,
    default: new Date()
  },
  method: {
    type: String,
    default: 'GET'
  },
  // body: {},
  // headers: {
  //   type: Object,
  //   default: {
  //     'content-type': 'application/json'
  //   }
  // },
  _owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

module.exports = { Request };
