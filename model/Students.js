const mongoose = require('mongoose')

const StudentSchema = new mongoose.Schema({
    name : String,
    googleId: String, 
    email: String,
    status: Boolean,
    class: String,
    mobile: Number,
    parent: String  
  });
 
const Students = mongoose.model('Students',StudentSchema);
module.exports = Students;