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
    bloodGoup: String,
    profilePic : { type : String , default: 'https://res.cloudinary.com/dijvr1gyk/image/upload/v1702963433/profile-pictures/ueuzzhankwtat6muzccz.jpg'},
    roll : { type: String, default: "Student"  , required: true },
    created : { type : Date , default : Date.now() }
  });
 
const Students = mongoose.model('Students',StudentSchema);
module.exports = Students;