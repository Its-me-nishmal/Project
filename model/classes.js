const mongoose = require('mongoose')

const cls = new mongoose.Schema({
    name : String,
    cls_count : String,
    cls_teacher : String,
    playlist: String,
})

const clsmodel = mongoose.model('cls',cls)

module.exports= clsmodel