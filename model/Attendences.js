const mongoose = require('mongoose')

const AttendSchema = new mongoose.Schema({
    date : { type: Date, default: new Date  , required: true , unique: true},
    students : [ { std_id: { type :  mongoose.Schema.Types.ObjectId, ref:'Students' , required: true},
    isPresent : {type: Boolean, default: true}}]
},{versionKey: false})

const Attendences = mongoose.model('Attendences',AttendSchema);

module.exports = Attendences;