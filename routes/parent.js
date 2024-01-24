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
const Attendences = require('../model/Attendences');

/* GET users listing. */
// router.get('/', function(req, res, next) {
//   if (res.cookie.student)
//     return res.render(path.join(__dirname,'../views/student/student.hbs'));
//   res.redirect('/student/login');
// });

router.get('/login', (req, res) => {
  res.render(path.join(__dirname, '../views/parent/login.hbs'));
});


router.get('/', async (req, res) => {
  if (req.cookies.parent_token) {
      try {
          const parent = await Parents.findOne({ token: req.cookies.parent_token })

          if (parent) {
              const student = await Students.findById(parent.student_id);

              if (student) {
                const attendances = await Attendences.aggregate([
                  { $match: {'students.std_id': student._id}},
                  {
                    $project: {
                      date: {
                        $dateToString: {
                          format: "%Y-%m-%d", // You can adjust the format as needed
                          date: "$date",
                          timezone: "GMT" // Set the desired timezone, or remove this line if no timezone conversion is needed
                        }
                      },
                      students: {
                        $filter:{
                          input: '$students',
                          as: 'student',
                          cond: {$eq: ['$$student.std_id',student._id]}
                        }
                      }
                    }
                  }
                ])
                
                  console.log(attendances);
                  
                  res.render('parent/index', { parent, student, attendances });
              } else {
                  res.redirect('/login');
              }
          } else {
              res.redirect('/login');
          }
      } catch (err) {
          res.redirect('/login');
      }
  } else {
      res.redirect('/login');
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, phone } = req.body;
    console.log(req.body);
    const check = await Parents.findOne({ email: email, phone: phone });

    if (!check) res.render(path.join(__dirname, '../views/parent/login.hbs'), { user: 'Invalid credentials' });

    const parent_token = jwt.sign({ ParentId: check._id }, process.env.JWT);
    check.token = parent_token;
    await check.save();

    res.cookie('parent_token', parent_token, { httpOnly: true });
    return res.redirect("/");
  } catch (e) {
    console.error(e);
  }
});



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

module.exports = router;
