var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose')
var mongodb = require('./.config/dbconnect.js')
const passport = require('./.config/auth.js');
const session = require('express-session');
const { auto_attendance, auto_holi_attendance }= require('./services/auto_attendences.js')
const cron = require('node-cron')
require('./services/mailsender.js')
const isholiday = require('./services/holiday.js');
const auto_leave = require('./services/auto_leave.js')
const { isSunday } = require('date-fns');
const MongoDBStore = require('connect-mongodb-session')(session);

const axios = require('axios');

const apiKey = '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';
const endpoint = 'https://api.openai.com/v1/chat/completions';
const store = new MongoDBStore({
  uri: 'mongodb+srv://alltrackerx:Nichuvdr%40786@cluster0.zqjk0it.mongodb.net/CMS',
  collection: 'sessions',
});

const { Configuration, OpenAIApi } = require("openai"); 
const readlineSync = require("readline-sync"); 
require("dotenv").config(); 





// Example usage:
// const conversation = [
//   { role: 'system', content: 'You are a helpful assistant.' }
// ];

// generateChatResponse(conversation)
//   .then((response) => {
//     console.log('ChatGPT Response:', response);
//   })
//   .catch((error) => {
//     console.error('Error:', error);
//   });


const to = new Date()

const check = isholiday(to)

mongodb();


var indexRouter = require('./routes/index');
var studentRouter = require('./routes/student.js');
const adminRouter = require('./routes/admin.js');
const teacherRouter = require('./routes/teacher.js');
const parentRouter = require('./routes/parent.js');
const Attendences = require('./model/Attendences.js');
const {Worker, isMainThread} = require('worker_threads')

if (isMainThread) {
  const worker = new Worker('./workers.js');

  cron.schedule('26 14 * * *', async () => {
    const check = isholiday(new Date());
  
  if (check === false) {
    if (!isSunday(new Date())) {
      worker.postMessage({ type: 'auto_attendance' });
      console.log('auto_attendance successfully');
      await auto_attendance();
    } else {
      console.log('Today is Sunday, no attendance required.');
    }
  } else {
    worker.postMessage({ type: 'auto_holi_attendance' });
    console.log('auto_holi_attendance successfully');
    await auto_holi_attendance()
  }
  });

}

  cron.schedule('59 14 * * *',async () => {
    const check = isholiday(new Date());

    if (check === false) {
      if (!isSunday(new Date())) {
        worker.postMessage({ type: 'auto_leave' });
        console.log('oo') 
        await auto_leave()
      } else {
        console.log('Today is Sunday, no leave information required.');
      }
    } else {
      console.log('Today is a holiday, no leave information required.');
    }
  });


var app = express();


app.use(require("express-session")({
  secret :'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',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true },
  saveUninitialized: true,
  store: store,
}));

app.get('/onesignal.js', (req, res) => {
  res.sendFile(__dirname + '/public/onesignal.js');
});








// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('subdomain offset', 1);

app.use((req, res, next) => {
  const subdomain = req.subdomains[0];
  console.log("sub",subdomain)
  if (subdomain === 'admin') {
    adminRouter(req, res, next); 
  } else if (subdomain === 'teacher') {
    teacherRouter(req, res, next); 
  } else if (subdomain === 'student') {
    studentRouter(req, res, next); 
  } else {
    indexRouter(req, res, next); 
  }
});


app.use(function(req, res, next) {
  next(createError(404));
});




// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
