var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
  res.render('index')
});

router.get('/onesignal.js', (req, res) => {
  res.sendFile(__dirname + '/public/OneSignalSDKWorker.js');
});

module.exports = router;
