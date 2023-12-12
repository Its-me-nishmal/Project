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

/* GET users listing. */
// router.get('/', function(req, res, next) {
//   if (res.cookie.student)
//     return res.render(path.join(__dirname,'../views/student/student.hbs'));
//   res.redirect('/student/login');
// });
// Replace with your actual YouTube playlist ID

  const fetchVideos = async () => {
    const apiKey = process.env.YT; // Replace with your actual YouTube API key
    const playlistId = 'PLY-ecO2csVHeJuOTlzJyNEC0FctWKx0yS';// Replace with your actual YouTube playlist ID
  
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
  



router.get('/', auth, async (req, res) => {
  try {
    const videos = await fetchVideos();

    if (req.cookies.student_token && req.student.roll === 'admin') {
      res.render(path.join(__dirname, '../views/student/student'), { student: req.student, Leader: 'leader', videos });
    } else if (req.cookies.student_token) {
      res.render(path.join(__dirname, '../views/student/student'), { student: req.student, videos });
    } else {
      res.redirect('/student/login');
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
          'students.std_id': new ObjectId(studentId),
        },
      },
      {
        $project: {
          _id: 0,
          date: 1,
          isPresent: {
            $filter: {
              input: '$students',
              as: 'student',
              cond: { $eq: ['$$student.std_id', new ObjectId(studentId)] },
            },
          },
        },
      },
    ]);

    console.log(att[0]);

    if (req.cookies.student_token && req.student.roll === 'admin') {
      res.render(path.join(__dirname, '../views/student/attendences'), { student: req.student, Leader: 'leader', att });
    } else if (req.cookies.student_token) {
      res.render(path.join(__dirname, '../views/student/attendences'), { student: req.student, att });
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
      res.render(path.join(__dirname, '../views/student/payments'), { student: req.student, Leader: 'leader' });
    } else if (req.cookies.student_token) {
      const studentId = req.student._id;

      console.log(studentId)
      const payments = await PaymentModel.find({ student: studentId });

      res.render(path.join(__dirname, '../views/student/payments'), { student: req.student, payments: payments });
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
    }
];
res.render(path.join(__dirname,'../views/student/notifications'), { notifications })
})

router.get('/solution',(req,res)=>{
res.render(path.join(__dirname,'../views/student/solution'))
})
module.exports = router;
