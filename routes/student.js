var express = require('express');
var router = express.Router();
const path = require('path')
const cookieParser = require('cookie-parser')
const passport = require('passport');

/* GET users listing. */
// router.get('/', function(req, res, next) {
//   if (res.cookie.student)
//     return res.render(path.join(__dirname,'../views/student/student.hbs'));
//   res.redirect('/student/login');
// });




router.get('/', function(req, res, next) {
    const usercookie = req.cookies.student
  
    if (usercookie) {
      try {
        const user = JSON.parse(usercookie)
        console.log(user);
        res.render(path.join(__dirname, '../views/student/student.hbs'), { user });
      } catch (err) {
        console.error(err)
      }
    } else {
      res.redirect('student/register')
    }
  });

router.get('/register',(req, res) => res.render(path.join(__dirname,'../views/student/register.hbs')));

router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    console.log(req.user)
    res.cookie('student',JSON.stringify(req.user))
    res.redirect('/student')
  }
);

router.get('/logout', function(req, res) {

  req.logout(function(err) {
    if (err) { return next(err); }
    res.clearCookie('student')
    res.redirect('/');

  });
});

module.exports = router;
