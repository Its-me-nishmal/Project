const mongoose = require('mongoose')

const TeacherSchema = new mongoose.Schema({
    name : String,
    googleId: String, 
    email: String,
    password : String,
    status: String,
    class: String,
    mobile: Number,
    phone: Number,
    parent: String,
    tokens : String,
    profilePic : { type : String , default: 'https://res.cloudinary.com/dijvr1gyk/image/upload/v1702963433/profile-pictures/ueuzzhankwtat6muzccz.jpg'},
    roll : { type: String, default: "Teacher"  , required: true },
    created : { type : Date , default : Date.now() }
  });
 
const Teachers = mongoose.model('Teachers',TeacherSchema);
module.exports = Teachers;