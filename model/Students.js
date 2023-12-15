const mongoose = require('mongoose')

const StudentSchema = new mongoose.Schema({
    name : String,
    googleId: String, 
    email: String,
    password : String,
    status: String,
    class: String,
    mobile: Number,
    parent: String,
    tokens : String,
    amount : String,
    roll : { type: String, default: "Student"  , required: true },
    created : { type : Date , default : Date.now() }
  });
 
const Students = mongoose.model('Students',StudentSchema);
module.exports = Students;