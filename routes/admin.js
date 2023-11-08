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
const {verify_teacher , reject_teacher,notifications} = require('../services/mailsender')



router.get('/', auth, async (req, res) => {
  if (req.cookies.admin_token) {
    try {
      const admin = await AdminModel.findOne({ tokens: req.cookies.admin_token });
      
      if (admin) {
        const teachers = await Teacher.find();
        const classes = await Classes.find();
        const students = await Students.find();
        const parents = await Parents.find();
        
        res.render(path.join(__dirname, '../views/admin/index'), {
          admin: req.admin,teachers,classes,students,parents
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

router.get('/login',  (req,res)=>res.render(path.join(__dirname,'../views/admin/login')))
router.get('/teachers', async (req, res) => {
    try {
      const teachers = await Teacher.find();
  
      const datas = await Classes.find();
      const data = datas.map((d)=> d.name)
      console.log(data);
res.render(path.join(__dirname, '../views/admin/teachers'), { teachers: teachers, classes: data })

    } catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
  });

  router.get('/students', async (req, res) => {
    try {
      const Student = await Students.find();
  
      // Render the 'teachers' view and pass the 'teachers' data to it
      res.render(path.join(__dirname, '../views/admin/students'), { students: Student });
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
  
router.get('/classes',async(req,res)=>{
   const data = await Classes.find()
    res.render(path.join(__dirname, '../views/admin/classes'),{classes: data})
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
// })


router.post('/login',async (req, res) => {
    const { email, password } = req.body;

    try{
        const Admin = await AdminModel.findOne({ email })
        if (!Admin) return res.status(200).render(path.join(__dirname,'../views/admin/login'),{add:true})
        const pass = await bcrypt.compare(password,Admin.password)
        if(!pass) return res.status(200).render(path.join(__dirname,'../views/admin/login'),{pass:true})
        const admin_token = jwt.sign({ AdminId : Admin._id},process.env.JWT)
        Admin.tokens = admin_token
        await Admin.save()        
        res.cookie('admin_token',admin_token, {httpOnly:true})
        res.redirect('/admin')
    }catch (err) {
        console.log(err);
    }
});

router.post('/new_pass',async (req,res)=>{
    const { email, password } = req.body
    console.log(email);
        try{
            const admin = await AdminModel.findOne({ email: 'admin@example.com' })
            const pass = await bcrypt.hash(password, 10)
            admin.email = email
            admin.password  = pass
            await admin.save();
            res.clearCookie('admin_token');
            res.json({message:'success'})
        } catch (err) {console.log(err)}
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

router.get('/notifications',(req,res)=>res.render(path.join(__dirname,'../views/admin/notifications')))


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




module.exports = router;