const mongoose = require('mongoose');

const Customer_Schema = mongoose.Schema({
  first_name: {
    type: String
  },
  last_name: {
    type: String
  },
  nic: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  ongoing_orders: {
    type: Number,
    default: 0
  },
  banned_date: {
    type: String,
    default: null
  },
  banned_time: {
    type: String,
    default: null
  },
  banned_hours: {
    // ban karapu peya gaana
    type: Number,
    default: 0
  },
  invoices_received_queue: [],
  
  notification_to_me: [{
    title: String,
    description: String,
    viewed: {
      type: Boolean,
      default: false
    }
  }],
});

module.exports = mongoose.model('Customer', Customer_Schema);
