const Students = require('../model/Students');
const auth = async (req, res, next) => {
  try {
    const token = req.cookies.student_token;
    if (!token) return res.redirect('/login')
    const student = await Students.findOne({ tokens: token });
    console.log("ok",student)
    if (!student) return res.redirect('/login')
    req.student = student;
    next();
  } catch (err) {console.log(err)};
};
module.exports = auth;
