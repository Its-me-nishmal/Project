var express = require('express');
var router = express.Router();
const path = require('path')
const cookieParser = require('cookie-parser')
const passport = require('passport');
const mongoose = require('mongoose')
const Teacher = require('../model/Teachers');
const bcrypt = require('bcrypt');
const Students = require('../model/Students');
require('dotenv').config();
const auth = require('../.config/teacher_auth')
const jwt = require('jsonwebtoken')

/* GET users listing. */
// router.get('/', function(req, res, next) {
//   if (res.cookie.student)
//     return res.render(path.join(__dirname,'../views/student/student.hbs'));
//   res.redirect('/student/login');
// });




router.get('/',auth,(req,res)=> req.cookies.teacher_token
? res.render(path.join(__dirname,'../views/teacher/teacher.hbs'),{teacher : req.teacher})
: res.redirect('/teacher/login'))

router.get('/register', (req, res) => res.render(path.join(__dirname, '../views/teacher/register.hbs')));
router.get('/login', (req, res) => res.render(path.join(__dirname, '../views/teacher/login.hbs')));

router.post('/register', async (req, res) => {
  console.log(req.body)
  const { anme , email, password } = req.body
  const user = new Teacher({
    name: anme,
    email: email,
    password: await bcrypt.hash(password, 10),
    status: "pending",
    class : 'Not Specified'
  });
  await user.save()
  res.redirect('/teacher/login')
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const check = await Teacher.findOne({ email: email });

    if (!check) {
      return res.render(path.join(__dirname, '../views/teacher/login.hbs'), { user: 'not find email' });
    }

    const pass = await bcrypt.compare(password, check.password);
    
    if (!pass) {
      return res.render(path.join(__dirname, '../views/teacher/login.hbs'), { pass: 'not valid' });
    }

    if (check.status === 'pending') {
      return res.render(path.join(__dirname, '../views/teacher/login.hbs'), { status_pending: 'pending' });
    } else if (check.status === 'rejected') {
      return res.render(path.join(__dirname, '../views/teacher/login.hbs'), { status_rejected: 'rejected' });
    } else {
      const teacher_token = jwt.sign({ TeacherId : check._id},process.env.JWT)
      check.tokens = teacher_token
      await check.save() 
      res.cookie('teacher_token', teacher_token, { httpOnly: true });
      return res.redirect('/teacher');
    }
  } catch (e) {
    console.error(e);
  }
});


router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    console.log(req.user)
    res.redirect('/teacher/login')
  }
);

router.get('/logout', function (req, res) {

  req.logout(function (err) {
    if (err) { return next(err); }
    res.clearCookie('teacher')
    res.redirect('/teacher');

  });
});

module.exports = router;



router.get('/students', auth ,  async (req, res) => {
  try {
    const teacher = req.teacher
    const students = await Students.find({ class : teacher.class });

    // Render the 'teachers' view and pass the 'teachers' data to it
    res.render(path.join(__dirname, '../views/teacher/students'), { students: students });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

router.post('/change_status', async (req, res) => {
  const { nmae, tstatus , tclass } = req.body;

  if (!nmae || !tstatus) {
      console.log('Name or Status missing in the request body');
      return res.status(400).send('Name or Status missing');
  }

  try {
      const student = await Students.findOne({ email: nmae });

      if (!student) {
          console.log('student not found');
          return res.status(404).send('student not found');
      }
      student.amount = tclass;
      student.status = tstatus; 
      await student.save(); // Save the updated document

      console.log('student status updated successfully');
      res.json(student)
  } catch (error) {
      console.log('Error updating teacher status');
      console.log(error);
      return res.status(500).send('Internal Server Error');
  }
});