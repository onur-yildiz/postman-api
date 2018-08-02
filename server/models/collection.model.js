const mongoose = require('mongoose');

const Collection = mongoose.model('Collection', {
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

module.exports = { Collection };
