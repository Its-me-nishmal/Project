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
const auto_attendences = require('../services/auto_attendences')
const attend = require('../model/Attendences')

/* GET users listing. */
// router.get('/', function(req, res, next) {
//   if (res.cookie.student)
//     return res.render(path.join(__dirname,'../views/student/student.hbs'));
//   res.redirect('/student/login');
// });




router.get('/', auth, (req, res) => req.cookies.teacher_token
  ? res.redirect("/students")
  : res.redirect('/login'))

router.get('/register', (req, res) => res.render(path.join(__dirname, '../views/teacher/register.hbs')));
router.get('/login', (req, res) => res.render(path.join(__dirname, '../views/teacher/login.hbs')));

router.post('/register', async (req, res) => {
  console.log(req.body)
  const { anme, email, password } = req.body
  const user = new Teacher({
    name: anme,
    email: email,
    password: await bcrypt.hash(password, 10),
    status: "pending",
    class: 'Not Specified'
  });
  await user.save()
  res.redirect('/login')
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
      const teacher_token = jwt.sign({ TeacherId: check._id }, process.env.JWT)
      check.tokens = teacher_token
      await check.save()
      res.cookie('teacher_token', teacher_token, { httpOnly: true });
      return res.redirect('/');
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
    res.clearCookie('teacher_token')
    res.redirect('/');

  });
});

module.exports = router;



router.get('/students', auth, async (req, res) => {
  try {
    let teacher = req.teacher;
    const teachers = await Students.find({ class: teacher.class });
    console.log(teachers)
    const teacherDatas = await Students.aggregate([
      {
        $match: { class: teacher.class } // Match documents with the teacher's class
    },
      {
        $group: {
          _id: null,
          totalRejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
          totalPending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          totalActive: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          totalCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          totalRejected: 1,
          totalPending: 1,
          totalActive: 1,
          totalCount: 1
        }
      }
    ])
    res.render(path.join(__dirname, '../views/teacher/students'), { teachers: teachers,students: teachers, td: teacherDatas,student:req.teacher })
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

router.get('/attendences', auth, async (req, res) => {
  try {
    const teacher = req.teacher;
    const classId = teacher.class;
    const today = new Date();
    const startOfDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    // Fetch the students belonging to the teacher's class.
    const students = await Students.find({ class: classId });

    const attendanceRecords = await attend.findOne({ date: startOfDay }); // assuming there's one record for each day

    // If no attendanceRecords exist for today, assume all students are absent
    if (!attendanceRecords) {
      students.forEach(student => {
        student.isPresent = false;
      });
    } else {
      students.forEach(student => {
        const studentAttendance = attendanceRecords.students.find(s => s.std_id.toString() === student._id.toString());
        student.isPresent = studentAttendance ? studentAttendance.isPresent : false;
      });
    }
    console.log(students)
    console.log(attendanceRecords)
    res.render(path.join(__dirname, '../views/teacher/attendences'), {
      students: students,
      attendanceRecords: attendanceRecords,
      student:req.teacher
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});




router.post('/update_attendences', async (req, res) => {
  const body = req.body;
  const today = new Date();
  const without_time = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  let attendanceRecord = await attend.findOne({ date: without_time });

  if (!attendanceRecord) {
    attendanceRecord = new attend({
      date: without_time,
      students: []
    });
  }

  body.forEach(item => {
    const studentId = item.std;
    const isPresent = item.att;


    const studentObj = attendanceRecord.students.find(student => student.std_id.toString() === studentId);

    if (studentObj) {
      studentObj.isPresent = isPresent;
    }
  });

  await attendanceRecord.save();

  res.status(200).send({ok:'ok'})
});



router.post('/change_status', async (req, res) => {
  const { nmae, tstatus, tclass } = req.body;

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

router.get('/solution',auth,(req,res)=>{
  res.render(path.join(__dirname,'../views/teacher/solution'),{student: req.teacher})
  })
  
  router.get('/support',auth, async (req,res) =>{
    res.render('support',{student:req.teacher})
  })
  router.get('/about-us',auth, async (req,res) =>{
    res.render('about',{student:req.teacher})
  })

  let generatedObjects = [];

function randomBooks() {
  for (let i = 0; i < 3; i++) {
    let randomId = Math.floor(Math.random() * (50000 - 10000 + 1)) + 10000;
    let newObject = {
      id: randomId,
      iframe: `https://www.gutenberg.org/cache/epub/${randomId}/pg${randomId}-images.html`,
      covers: [
        `https://www.gutenberg.org/cache/epub/${randomId}/pg${randomId}.cover.medium.jpg`,
      ]
    };
    generatedObjects.push(newObject);
  }

  return generatedObjects;
}

function generateFavoriteBooks(favoriteIds) {
  return favoriteIds.map(id => {
    return {
      id,
      iframe: `https://www.gutenberg.org/cache/epub/${id}/pg${id}-images.html`,
      covers: [
        `https://www.gutenberg.org/cache/epub/${id}/pg${id}.cover.medium.jpg`,
      ]
    };
  });
}



router.get('/ebooks', auth, async (req, res) => {
  try {
    const favorites = JSON.parse(req.cookies.fav || '[]');
    const favoriteBooks = generateFavoriteBooks(favorites);
    const generatedObjects = randomBooks();
    if (req.cookies.teacher_token) {
      res.render(path.join(__dirname, '../views/teacher/E-Books'), { student: req.teacher, generatedObjects, favoriteBooks });
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    console.error('Error rendering page:', error.message);
    res.status(500).send('Internal Server Error');
  }
});