const express = require('express')
const router = express.Router()
const path = require('path')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const AdminModel = require('../model/Admin')
const Teacher = require('../model/Teachers');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
require('dotenv').config();
const auth = require('../.config/admin_auth');
const Students = require('../model/Students');
const Classes = require('../model/classes')
const Parents = require('../model/Parents')
const Payments = require('../model/Payments')
const { verify_teacher, reject_teacher, notifications } = require('../services/mailsender')
const mongodb = require('../.config/dbconnect')
const Attendences = require('../model/Attendences');
const Banner = require('../model/Banner')



router.get('/', auth, async (req, res) => {
  if (req.cookies.admin_token) {
    try {
      await mongodb();

      const AdminModel = require('../model/Admin');
      const Teacher = require('../model/Teachers');
      const Students = require('../model/Students');
      const Classes = require('../model/classes');
      const Parents = require('../model/Parents');
      const Payments = require('../model/Payments');

      const admin = await AdminModel.findOne({ tokens: req.cookies.admin_token });

      if (admin) {
        const teachers = await Teacher.find();
        const classes = await Classes.find();
        const students = await Students.find();
        const parents = await Parents.find();

        const recentStudents = await Students.aggregate([
          {
            $sort: {
              created: -1,
            },
          },
          {
            $limit: 5,
          },
        ]).exec();

        const recentTeachers = await Teacher.aggregate([
          {
            $sort: {
              created: -1,
            },
          },
          {
            $limit: 5,
          },
        ]).exec();

        const recentPayments = await Payments.aggregate([
          {
            $sort: {
              created: -1,
            },
          },
          {
            $limit: 5,
          },
        ]).exec();

        res.render(path.join(__dirname, '../views/admin/index'), {
          admin: req.admin,
          teachers,
          classes,
          students,
          parents,
          recentStudents,
          recentTeachers,
          recentPayments,
        });
      } else {
        res.redirect('/admin/login');
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect('/admin/login');
  }
});

router.get('/login', (req, res) => res.render(path.join(__dirname, '../views/admin/login')))
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await Teacher.find();
    const teacherDatas = await Teacher.aggregate([
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
    const datas = await Classes.find();
    const data = datas.map((d) => d.name)
    res.render(path.join(__dirname, '../views/admin/teachers'), { teachers: teachers, classes: data, td: teacherDatas })

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

router.get('/students', async (req, res) => {
  try {
    const Student = await Students.find();
    const studentDate = await Students.aggregate([
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

    // Render the 'teachers' view and pass the 'teachers' data to it
    res.render(path.join(__dirname, '../views/admin/students'), { students: Student, td: studentDate });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
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
    student.roll = tclass;
    student.status = tstatus;
    await student.save();

    console.log('student status updated successfully');
    res.json(student)
  } catch (error) {
    console.log('Error updating teacher status');
    console.log(error);
    return res.status(500).send('Internal Server Error');
  }
});

router.get('/classes', async (req, res) => {
  const data = await Classes.find()
  const courses = await Classes.aggregate([
    {
      $group: {
        _id: null,
        total_count: { $sum: { $cond: { if: { $isArray: "$playlist" }, then: { $size: "$playlist" }, else: 0 } } }
      }
    }
  ])
  res.render(path.join(__dirname, '../views/admin/classes'), { classes: data, courses })
})

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
//     res.send('success')
// })


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const Admin = await AdminModel.findOne({ email })
    if (!Admin) return res.status(200).render(path.join(__dirname, '../views/admin/login'), { add: true })
    const pass = await bcrypt.compare(password, Admin.password)
    if (!pass) return res.status(200).render(path.join(__dirname, '../views/admin/login'), { pass: true })
    const admin_token = jwt.sign({ AdminId: Admin._id }, process.env.JWT)
    Admin.tokens = admin_token
    await Admin.save()
    res.cookie('admin_token', admin_token, { httpOnly: true })
    res.redirect('/admin')
  } catch (err) {
    console.log(err);
  }
});



router.post('/new_pass', async (req, res) => {
  const { email, password } = req.body
  console.log(email);
  try {
    const admin = await AdminModel.findOne({ email: 'admin@example.com' })
    const pass = await bcrypt.hash(password, 10)
    admin.email = email
    admin.password = pass
    await admin.save();
    res.clearCookie('admin_token');
    res.json({ message: 'success' })
  } catch (err) { console.log(err) }
})


router.post('/change_statuss', async (req, res) => {
  const { nmae, tstatus, tclass } = req.body;

  if (!nmae || !tstatus) {
    console.log('Name or Status missing in the request body');
    return res.status(400).send('Name or Status missing');
  }

  try {
    const teacher = await Teacher.findOne({ email: nmae });

    if (!teacher) {
      console.log('Teacher not found');
      return res.status(404).send('Teacher not found');
    }

    const existingTeacher = await Teacher.findOne({ class: tclass });
    if (existingTeacher && String(existingTeacher._id) !== String(teacher._id)) {
      existingTeacher.class = 'not specified';
      await existingTeacher.save();
    }
    teacher.class = tclass;
    teacher.status = tstatus;
    await teacher.save();

    if (teacher.status === 'active') {
      verify_teacher(teacher.email);
    } else if (teacher.status === 'rejected') {
      reject_teacher(teacher.email);
    } else {
      console.log('pending');
    }

    console.log('Teacher status updated successfully');

    await assignTeacherToClass(teacher._id, tclass);

    res.json(teacher);

  } catch (error) {
    console.log('Error updating teacher status');
    console.log(error);
    return res.status(500).send('Internal Server Error');
  }
});


async function assignTeacherToClass(teacherId, className) {
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    console.log('Teacher not found');
    return;
  }

  const previousClass = await Classes.findOne({ cls_teacher: teacher.name });
  if (previousClass) {
    previousClass.cls_teacher = null;
    await previousClass.save();
  }

  const newClass = await Classes.findOne({ name: className });
  if (newClass) {
    newClass.cls_teacher = teacher.name;
    await newClass.save();
  } else {
    console.log('New class not found');
  }
}


router.post('/classes', async (req, res) => {
  try {
    const data = req.body;
    const newClasses = await Classes.insertMany(data);
    res.status(200).json(newClasses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const { id, playlist } = req.body;

    // Validate request body
    if (!id || !playlist) {
      return res.status(400).json({ error: 'Bad Request. Missing required fields.' });
    }

    const cls = await Classes.findById(id);

    if (!cls) {
      return res.status(404).json({ error: 'Class not found.' });
    }

    // Update playlist
    cls.playlist = playlist;

    // Save changes
    const data = await cls.save();

    // Send updated data in the response
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const students = await Students.find();
    res.status(200).render(path.join(__dirname, '../views/admin/payments'), { students })
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/make-payments', async (req, res) => {
  try {
    const selectedStudentIdsString = req.body.ids;
    const globalAmount = req.body.amount;
    const reason = req.body.reason;

    console.log('Selected Student IDs:', selectedStudentIdsString);
    console.log('Global Amount:', globalAmount);
    // Ensure that at least one student is selected
    if (!selectedStudentIdsString || selectedStudentIdsString.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one student.' });
    }

    // Fetch selected students from the database
    const selectedStudents = await Students.find({ _id: { $in: selectedStudentIdsString } });

    // Process payments for selected students
    const paymentPromises = selectedStudents.map(student => {
      const payment = new Payments({
        amount: globalAmount,
        student: student._id,
        reason: reason
      });

      return payment.save();
    });

    // Wait for all payments to be saved
    await Promise.all(paymentPromises);

    // Respond with a success message
    res.status(200).json({ success: true, message: 'Payments processed successfully.' });
  } catch (error) {
    console.error('Error processing payments:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


router.delete('/classes/:name', async (req, res) => {
  const className = req.params.name;

  try {
    const classesData = await Classes.find();
    const index = classesData.findIndex(c => c.name === className);

    if (index !== -1) {
      await Classes.deleteOne({ name: className });
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/attendences', async (req, res) => {
  let day = new Date();
  let dateString = day.toISOString().split("T")[0];

  const attendance = await Attendences.aggregate([
    {
      $match: {
        date: new Date(dateString)
      }
    },
    {
      $project: {
        _id: 0,
        presentStudents: {
          $map: {
            input: {
              $filter: {
                input: "$students",
                cond: {
                  $and: [
                    { $eq: ["$$this.isPresent", true] },
                    { $ne: ["$$this.name", null] }
                  ]
                }
              }
            },
            as: "student",
            in: "$$student.std_id"
          }
        },
        absentStudents: {
          $map: {
            input: {
              $filter: {
                input: "$students",
                cond: {
                  $and: [
                    { $eq: ["$$this.isPresent", false] },
                    { $ne: ["$$this.name", null] }
                  ]
                }
              }
            },
            as: "student",
            in: "$$student.std_id"
          }
        }
      }
    }
  ]);

  console.log(attendance);

  const presentStudentIds = attendance[0].presentStudents;
  const absentStudentIds = attendance[0].absentStudents;
  console.log(presentStudentIds)
  const presentStudents = await Students.find({ _id: { $in: presentStudentIds } });

  // Finding absent students
  const absentStudents = await Students.find({ _id: { $in: absentStudentIds } });
console.log(presentStudents)
  res.render(path.join(__dirname, '../views/admin/attendences'), {
    atd: attendance,
    presentStudents,
    absentStudents,
  });
});



router.post('/notify', async (req, res) => {
  const { category, newValue, specialEmail } = req.body;
  console.log(category)
  if (category === 'Students') {
    const students = await Students.find();

    students.forEach(student => {
      notifications(student.email, newValue);
    });

  } else if (category === 'Parents') {
    const parents = await Parents.find();

    parents.forEach(parent => {
      notifications(parent.email, newValue);
    });

  } else if (category === 'Teachers') {
    const teachers = await Teacher.find();

    teachers.forEach(teacher => {
      notifications(teacher.email, newValue);
    });

  } else {
    notifications(specialEmail, newValue);
  }

  res.json({ message: 'Emails sent successfully' });
});

router.get('/solution', (req, res) => {
  res.render(path.join(__dirname, '../views/admin/solution'))
})


router.get('/banner',(req,res)=>{
  res.render(path.join(__dirname, '../views/admin/banner'))
})

router.put("/banner", async (req, res) => {
  try {
    // Use await directly on the updateOne method
    await Banner.updateOne({}, { $set: { playlist: req.body.playlist } });
    res.json({ message: 'Banner updated successfully' });
  } catch (err) {
    // Handle the error appropriately (e.g., send an error response)
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = router;