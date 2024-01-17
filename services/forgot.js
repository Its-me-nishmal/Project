const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your_email@gmail.com',
    pass: 'your_email_password'
  }
});

const token = generateToken();
storeTokenInDatabase(userEmail, token);

const resetLink = `http://yourwebsite.com/reset-password/${token}`;

const mailOptions = {
  from: 'your_email@gmail.com',
  to: userEmail,
  subject: 'Password Reset',
  text: `Click the following link to reset your password: ${resetLink}`
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});


app.get('/reset-password/:token', (req, res) => {
    const token = req.params.token;
  
    if (isValidToken(token)) {
      res.render('reset-password-form', { token });
    } else {
      res.render('token-invalid');
    }
  });
  
