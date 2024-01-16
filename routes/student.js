var express = require('express');
var router = express.Router();
const path = require('path')
const cookieParser = require('cookie-parser')
const passport = require('passport');
const mongoose = require('mongoose')
const Students = require('../model/Students');
const Parents = require('../model/Parents');
const Attendences = require('../model/Attendences')
const bcrypt = require('bcrypt');
require('dotenv').config();
const auth = require('../.config/student_auth')
const jwt = require('jsonwebtoken')
const Classes = require('../model/classes');
const clearRequire = require('clear-require');
const Razorpay = require('razorpay');
const PaymentModel = require('../model/Payments');
const ObjectId = mongoose.Types.ObjectId;
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: 'dijvr1gyk',
  api_key: '827348513767443',
  api_secret: 'iUA9Awo6pH7bKV5j10o05d6Kd9o',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'profile-pictures',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 150, height: 150, crop: 'limit' }],
  },
});

/* GET users listing. */
// router.get('/', function(req, res, next) {
//   if (res.cookie.student)
//     return res.render(path.join(__dirname,'../views/student/student.hbs'));
//   res.redirect('/student/login');
// });
// Replace with your actual YouTube playlist ID

  const fetchVideos = async (id) => {
    const apiKey = process.env.YT; // Replace with your actual YouTube API key
    const playlistId = id;// Replace with your actual YouTube playlist ID
  
    try {
      // Fetch video details including videoId
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&key=${apiKey}&maxResults=50`
      );
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const responseData = await response.json();
  
      // Extract videoIds from the first API call
      const videoIds = responseData.items.map(item => item.contentDetails.videoId).join(',');
  
      // Fetch video statistics using the extracted videoIds
      const statisticsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`
      );
  
      if (!statisticsResponse.ok) {
        throw new Error(`HTTP error! Status: ${statisticsResponse.status}`);
      }
  
      const statisticsData = await statisticsResponse.json();
  
      // Combine information from both API calls
      const videos = responseData.items.map(item => {
        const videoStatistics = statisticsData.items.find(statisticsItem => statisticsItem.id === item.contentDetails.videoId).statistics;
  
        return {
          title: item.snippet.title,
          description: videoStatistics ? videoStatistics.viewCount : '0',
          thumbnail: item.snippet.thumbnails.medium.url,
          videoId: item.contentDetails.videoId,
        };
      });
  
      console.log(videos);
      return videos;
    } catch (error) {
      console.error('Error fetching videos:', error.message);
      return [];
    }
  };
  
  router.get('/videos/:index',auth, async (req, res) => {
    try {
      const index = req.params.index;
      const stdcls = await Classes.findOne({ name: req.student.class });
      const videos = await fetchVideos(stdcls.playlist[index]);
      console.log(videos);
      res.json(videos);
    } catch (error) {
      console.error('Error fetching videos:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


router.get('/', auth, async (req, res) => {
  const stdcls = await Classes.findOne({name:req.student.class});
  console.log(stdcls.playlist);
      const videos = await fetchVideos(stdcls.playlist[0]);
  try {

    if (req.cookies.student_token && req.student.roll === 'admin') {

      res.render(path.join(__dirname, '../views/student/student'), { student: req.student, Leader: 'leader',  videos,play:stdcls.playlist});
    } else if (req.cookies.student_token) {
      res.render(path.join(__dirname, '../views/student/student'), { student: req.student,  videos, play:stdcls.playlist});
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    console.error('Error rendering page:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Function to fetch ebooks from Open Library API using fetch
// async function fetchEbooks() {
//   try {
//     // You can customize the query parameters based on your requirements
//     const response = await fetch('https://openlibrary.org/subjects/ebooks.json?limit=10');

//     if (!response.ok) {
//       throw new Error(`Error fetching ebooks: ${response.statusText}`);
//     }

//     const responseData = await response.json();

//     // Extract relevant information from the response
//     const ebooks = responseData.works.map(work => ({
//       title: work.title,
//       author: work.authors ? work.authors[0].name : 'Unknown Author',
//       coverUrl: `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg`,
//       contentUrl: `https://openlibrary.org${work.key}`, // Example link to Open Library page
//       // Add more fields as needed
//     }));

//     return ebooks;
//   } catch (error) {
//     console.error('Error fetching ebooks from Open Library API:', error.message);
//     throw error;
//   }
// }
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

const razorpay = new Razorpay({
  key_id: process.env.PAY_KEY,
  key_secret: process.env.PAY_ID,
});

router.get('/ebooks', auth, async (req, res) => {
  try {
    clearRequire.all();
    const favorites = JSON.parse(req.cookies.fav || '[]');
    const favoriteBooks = generateFavoriteBooks(favorites);
    const generatedObjects = randomBooks();
    if (req.cookies.student_token && req.student.roll === 'admin') {
      res.render(path.join(__dirname, '../views/student/E-Books'), { student: req.student, Leader: 'leader', generatedObjects, favoriteBooks });
    } else if (req.cookies.student_token) {
      res.render(path.join(__dirname, '../views/student/E-Books'), { student: req.student, generatedObjects, favoriteBooks });
    } else {
      res.redirect('/student/login');
    }
  } catch (error) {
    console.error('Error rendering page:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/attendences', auth, async (req, res) => {
  try {
    const studentId = req.student._id;
    const att = await Attendences.aggregate([
      {
        $match: {
          "students.std_id": new ObjectId("654c6f6ea60680a23aaa4a5d")
        }
      },
      {
        $project: {
          eventName: "$holi",
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
            },
          },
          color: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ["$holi", "false"],
                  },
                  then: "green",
                },
              ],
              default: "yellow",
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          data: {
            $push: {
              eventName: "$eventName",
              date: "$date",
              color: "$color",
            },
          },
        },
      },
    ]
    );

    let attend = JSON.stringify(att[0].data)
    if (req.cookies.student_token && req.student.roll === 'admin') {
      res.render(path.join(__dirname, '../views/student/attendences'), { student: req.student, Leader: 'leader', att: attend });
    } else if (req.cookies.student_token) {
      res.render(path.join(__dirname, '../views/student/attendences'), { student: req.student, att: attend });
    } else {
      res.redirect('/student/login');
    }
  } catch (error) {
    console.error('Error rendering page:', error.message);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/payments', auth, async (req, res) => {
  try {
    if (req.cookies.student_token && req.student.roll !== 'admin') {
      const studentId = req.student._id;
      const payments = await PaymentModel.find({ student: studentId });
      res.render(path.join(__dirname, '../views/student/payments'), { student: req.student,payments: payments  });
    } else if (req.cookies.student_token) {
      const studentId = req.student._id;

      console.log(studentId)
      const payments = await PaymentModel.find({ student: studentId });

      res.render(path.join(__dirname, '../views/student/payments'), { student: req.student, payments: payments, Leader: 'leader' });
    } else {
      res.redirect('/student/login');
    }
  } catch (error) {
    console.error('Error rendering page:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/create-razorpay-order',auth, async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const razorpayOptions = {
      key: process.env.PAY_KEY,
      amount: amount * 100,
      currency: 'INR',
      name: 'Your Company Name',
      description: 'Payment for Order',
      image: 'your_company_logo_url',
      prefill: {
        name: 'Customer Name',
        email: 'customer@example.com',
        contact: '1234567890',
      },
    };

    res.json({ razorpayOptions });
  } catch (error) {
    res.status(500).send(error);
  }
});


router.post('/pay', async (req, res) => {
  try {
    const { objId, payId } = req.body;

    const updatedPayment = await PaymentModel.findOneAndUpdate(
      { _id: objId },
      {
        $set: {
          isPaid: true,
          paymentId: payId || '',
        },
      },
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    res.status(200).json({ success: true, message: 'Payment updated successfully.' });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

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
  res.redirect('/login')
  
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
      return res.redirect('/');
    }
  } catch (e) {
    console.error(e);
  }
});

router.get('/profile',auth, async (req,res) =>{
  let parent = await Parents.findOne({"student_id":req.student._id})
  if(parent){
    console.log(parent)
    return res.render(path.join(__dirname,'../views/student/profile'),{student: req.student,parent})
  }
  res.render(path.join(__dirname,'../views/student/profile'),{student: req.student})
} )



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
    res.redirect('/');

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
      res.cookie("ok","ok")
      res.status(200).redirect("/profile");
  } catch(e){console.log(e);}
})

const upload = multer({ storage });
router.post('/profile',auth, upload.single('profilePicture'), async (req, res) => {
  try {
    const { basic_icon_default_phone , basic_icon_default_blood_group, basic_icon_default_name } = req.body;

    const existingUser = await Students.findById(req.student._id);
    console.log(existingUser)
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user details
    existingUser.name = basic_icon_default_name;
    existingUser.bloodGoup = basic_icon_default_blood_group;
    existingUser.phone = basic_icon_default_phone;

    // If a new profile picture is uploaded, update the profilePicture field
    if (req.file) {
      existingUser.profilePic = req.file.path;
    }

    // Save the changes
    await existingUser.save();
    res.cookie("ok","ok")
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/notifications', auth, (req,res)=>{
  const notifications = [
    {
        content: "New notification 1",
        desc: "hello sjhfksjhfkshk fjhjk hksdhf kh khkfhkfhkfhkfhdkfhksfhkfhkshfksdhfkshfskldfhklsaghflkasgflkashgfklasgfklasgdfklasdghf  hk h  khk sdk gk k  k kh k kl kg kg kdg k kg kd kd k kjg klg kjg kg k k k k kjgfkjsdfffff kk gjjkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkjgkgkkjgkjgfsldf",
        time: "2023-11-07 10:00 AM",
        read: false,
    },
    {
        content: "New notification 2",
        time: "2023-11-07 11:00 AM",
        read: true,
    }
];
res.render(path.join(__dirname,'../views/student/notifications'), { notifications,student: req.student })
})

router.get('/solution',auth,(req,res)=>{
res.render(path.join(__dirname,'../views/student/solution'),{student: req.student})
})

router.get('/support', async (req,res) =>{
  res.render('support')
})
router.get('/about-us', async (req,res) =>{
  res.render('about')
})
module.exports = router;
