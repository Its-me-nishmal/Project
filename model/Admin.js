const mongoose = require('mongoose')

const AdminSchema = new mongoose.Schema({
    email : String,
    password : String,
    tokens : String
})

const Admin = mongoose.model('Admin',AdminSchema)
module.exports = Admin;