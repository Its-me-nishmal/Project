const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: Number,
  date: { type: Date, default: Date.now },
  isPaid: { type: Boolean, default: false },
  reason: {type:String},
  paymentId: {type:String},
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'students'
  }
});

const PaymentModel = mongoose.model('Payment', paymentSchema);

module.exports = PaymentModel;
