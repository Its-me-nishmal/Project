var express = require('express');
var router = express.Router();
const path = require('path')
const cookieParser = require('cookie-parser')
const passport = require('passport');
const mongoose = require('mongoose')
const Students = require('../model/Students');
const Parents = require('../model/Parents');
const bcrypt = require('bcrypt');
require('dotenv').config();
const auth = require('../.config/student_auth')
const jwt = require('jsonwebtoken')
const Classes = require('../model/classes');
var mongodb = require('./.config/dbconnect')

async function main () {
  await mongodb();
}
main();

/* GET users listing. */
// router.get('/', function(req, res, next) {
//   if (res.cookie.student)
//     return res.render(path.join(__dirname,'../views/student/student.hbs'));
//   res.redirect('/student/login');
// });




router.get('/',auth,(req,res)=> req.cookies.student_token
&& req.student.roll == 'admin' ? res.render(path.join(__dirname,'../views/student/student'),{student : req.student,Leader:"leader"})
: req.cookies.student_token ? res.render(path.join(__dirname,'../views/student/student'),{student : req.student})
: res.redirect('/student/login'))

router.get('/register', async (req, res) => {
  try {
      const classesData = await Classes.find();
      res.render(path.join(__dirname, '../views/student/register.hbs'), { classes: classesData });
  } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).send('Internal Server Error');
  }
});

router.get('/login', (req, res) => res.render(path.join(__dirname, '../views/student/login.hbs')));

router.post('/register', async (req, res) => {
  const { anme , email, password , selectNumber } = req.body
  const pass = await bcrypt.hash(password, 10)
  console.log(pass)
  const user = new Students({
    name: anme,
    email: email,
    password: pass,
    status: "pending",
    class : selectNumber,
    amount : '0'
  });
  await user.save()
  res.redirect('/student/login')
  
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const check = await Students.findOne({ email: email });

    if (!check) {
      return res.render(path.join(__dirname, '../views/student/login.hbs'), { user: 'not find email' });
    }
    console.log(password + " " + check.password);
    const pass = await bcrypt.compare(password, check.password);
    
    if (!pass) {
      return res.render(path.join(__dirname, '../views/student/login.hbs'), { pass: 'not valid' });
    }

    if (check.status === 'pending') {
      return res.render(path.join(__dirname, '../views/student/login.hbs'), { status_pending: 'pending' });
    } else if (check.status === 'rejected') {
      return res.render(path.join(__dirname, '../views/student/login.hbs'), { status_rejected: 'rejected' });
    } else if (check.status === 'payment') {
      return res.render(path.join(__dirname, '../views/student/login.hbs'), { pay: check.amount });
    } else {
      const student_token = jwt.sign({ StudentId : check._id},process.env.JWT)
      check.tokens = student_token
      await check.save() 
      res.cookie('student_token', student_token, { httpOnly: true });
      return res.redirect('/student');
    }
  } catch (e) {
    console.error(e);
  }
});

router.get('/profile',auth, (req,res) => res.render(path.join(__dirname,'../views/student/profile')))

router.post('/payment',(req,res)=>{res.send('going to payment')})

router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    console.log(req.user)
    res.redirect('/student/login')
  }
);

router.get('/logout', function (req, res) {

  req.logout(function (err) {
    if (err) { return next(err); }
    res.clearCookie('student_token')
    res.redirect('/student');

  });
});

router.post("/profile/update/parent",auth,async(req,res)=>{
  const { pname, job, phone, email } = req.body;
  const { _id } = req.student;
  try{
    const parent = await Parents.findOneAndUpdate({student_id: _id},
      {
        phone: phone,
        job: job,
        email: email,
        name:pname,
        token:jwt.sign({_id},process.env.PARENT)
      },{upsert:true,new:true});
      res.status(200).send("success");
  } catch(e){console.log(e);}
})

router.get('/notifications',(req,res)=>{
  const notifications = [
    {
        content: "New notification 1",
        time: "2023-11-07 10:00 AM",
        read: false,
    },
    {
        content: "New notification 2",
        time: "2023-11-07 11:00 AM",
        read: true,
    },
    // Add more notifications here
];
res.render(path.join(__dirname,'../views/student/notifications'), { notifications })
})

module.exports = router;
