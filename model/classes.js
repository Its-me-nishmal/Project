const mongoose = require('mongoose')

const cls = new mongoose.Schema({
    name : String,
    playlist_url : String,
    cls_teacher : String,
    playlist: Array,
})

const clsmodel = mongoose.model('cls',cls)

module.exports= clsmodel