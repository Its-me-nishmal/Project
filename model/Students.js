const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name : String,
    googleId: String, 
    email: String,    
  });
 
const Students = mongoose.model('Students',UserSchema);
module.exports = Students;