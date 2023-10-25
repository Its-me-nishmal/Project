var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose')
var mongodb = require('./.config/dbconnect')
const passport = require('./.config/auth.js');
const auto_attendence = require('./services/auto_attendences')
const cron = require('node-cron')
require('./services/mailsender')






var indexRouter = require('./routes/index');
var studentRouter = require('./routes/student');
const adminRouter = require('./routes/admin');
const teacherRouter = require('./routes/teacher');
const Attendences = require('./model/Attendences');


var app = express();


app.use(require("express-session")({
  secret :'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',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}))

cron.schedule('0 9 * * *', async () => {
  await auto_attendence();
  console.log('auto_attendance successflly');
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

const axios = require('axios');

const options = {
  method: 'GET',
  url: 'https://public-holiday.p.rapidapi.com/2023/IN',
  headers: {
    'X-RapidAPI-Key': 'c28fcc9f22msh69234def6d06879p11cbbejsn15d48e1ff306',
    'X-RapidAPI-Host': 'public-holiday.p.rapidapi.com'
  }
};

// Use an async function to make asynchronous requests
async function fetchData() {
  try {
    const response = await axios.request(options);
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

// Call the async function to initiate the request
fetchData();


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

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

async function main () {
  await mongodb();
}
main();


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
