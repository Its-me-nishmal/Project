const express = require('express')
const router = express.Router()
const path = require('path')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const AdminModel = require('../model/Admin')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
require('dotenv').config();
const auth = require('../.config/admin_auth')


router.get('/',auth,(req,res)=> req.cookies.admin_token
? res.render(path.join(__dirname,'../views/admin/index'),{admin : req.admin})
: res.redirect('/admin/login'))

router.get('/login',(req,res)=>res.render(path.join(__dirname,'../views/admin/login')))


// router.get('/register',async(req,res)=>{
//     email = process.env.DEFAULT_ADMIN
//     password = process.env.ADMIN_PASSWORD
//     hashpass = await bcrypt.hash(password,10)
//     const admin = new AdminModel({
//         email : email,
//         password : hashpass
//     })
//     let ok = await admin.save()
//     console.log(ok);
// })


router.post('/login',async (req, res) => {
    const { email, password } = req.body;

    try{
        const Admin = await AdminModel.findOne({ email })
        if (!Admin) return res.status('200').json({message:'Admin Not Found'})
        const pass = await bcrypt.compare(password,Admin.password)
        if(!pass) return res.status('200').json({message:'incorect password'})
        const admin_token = jwt.sign({ AdminId : Admin._id},process.env.JWT)
        Admin.tokens = admin_token
        await Admin.save()        
        res.cookie('admin_token',admin_token, {httpOnly:true})
        res.status('200').json({message:'success'})
    }catch (err) {
        console.log(err);
    }
});

module.exports = router;