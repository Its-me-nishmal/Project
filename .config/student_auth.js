const Students = require('../model/Students');
const auth = async (req, res, next) => {
  try {
    const token = req.cookies.student_token;
    const student = await Students.findOne({ tokens: token });
    if (!student) return res.redirect('/login')
    req.student = student;
    next();
  } catch (err) {console.log(err)};
};
module.exports = auth;
