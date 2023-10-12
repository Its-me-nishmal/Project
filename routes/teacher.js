var express = require('express');
var router = express.Router();
const path = require('path')
const cookieParser = require('cookie-parser')
const passport = require('passport');
const mongoose = require('mongoose')
const Teacher = require('../model/Teachers');
const bcrypt = require('bcrypt');

/* GET users listing. */
// router.get('/', function(req, res, next) {
//   if (res.cookie.student)
//     return res.render(path.join(__dirname,'../views/student/student.hbs'));
//   res.redirect('/student/login');
// });




router.get('/', function (req, res, next) {
  const usercookie = req.cookies.teacher

  if (usercookie) {
    try {
      const user = usercookie
      console.log(user);
      res.render(path.join(__dirname, '../views/teacher/teacher.hbs'), { user });
    } catch (err) {
      console.error(err)
    }
  } else {
    res.redirect('teacher/register')
  }
});

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
      res.cookie('teacher', email, { httpOnly: true });
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
