const mongoose = require('mongoose');
const parentModel = new mongoose.Schema({
    student_id : {type:mongoose.Schema.Types.ObjectId, ref:'students', required:true},
    name : String,
    job: String,
    email : {type:String, required:true, uniquie:true},
    phone: Number,
    token: String
})

const parent = mongoose.model('parent',parentModel)
module.exports = parent;