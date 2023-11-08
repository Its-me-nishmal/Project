const express = require('express');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2

const app = express();
cloudinary.config({
    cloud_name: 'cms',
    api_key: '827348513767443',
    api_secret: 'iUA9Awo6pH7bKV5j10o05d6Kd9o'
})

module.exports = cloudinary;


