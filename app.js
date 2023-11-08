var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose')
var mongodb = require('./.config/dbconnect')
const passport = require('./.config/auth.js');
const { auto_attendance, auto_holi_attendance }= require('./services/auto_attendences')
const cron = require('node-cron')
require('./services/mailsender')
const isholiday = require('./services/holiday');
const auto_leave = require('./services/auto_leave')
const { isSunday } = require('date-fns');


const to = new Date()

const check = isholiday(to)

mongodb();


var indexRouter = require('./routes/index');
var studentRouter = require('./routes/student');
const adminRouter = require('./routes/admin');
const teacherRouter = require('./routes/teacher');
const parentRouter = require('./routes/parent');
const Attendences = require('./model/Attendences');
const {Worker, isMainThread} = require('worker_threads')

if (isMainThread) {
  const worker = new Worker('./workers.js');

  cron.schedule('10 15 * * *', async () => {
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

  

  cron.schedule('59 9 * * *',async () => {
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
}

var app = express();


app.use(require("express-session")({
  secret :'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',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}))


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


app.use('/', indexRouter);
app.use('/student', studentRouter);
app.use('/admin', adminRouter)
app.use('/teacher', teacherRouter);
app.use('/parent', parentRouter);


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
