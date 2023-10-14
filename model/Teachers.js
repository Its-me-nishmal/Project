const mongoose = require('mongoose')

const TeacherSchema = new mongoose.Schema({
    name : String,
    googleId: String, 
    email: String,
    password : String,
    status: String,
    class: String,
    mobile: Number,
    parent: String,
    tokens : String  
  });
 
const Teachers = mongoose.model('Teachers',TeacherSchema);
module.exports = Teachers;