const mongoose = require('mongoose')

const BannerSchema = new mongoose.Schema({
    playlist : String
})

const Banner = mongoose.model('Banner',BannerSchema)
module.exports = Banner;