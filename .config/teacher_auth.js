const Teacher = require('../model/Teachers');
const auth = async (req, res, next) => {
  try {
    const token = req.cookies.teacher_token;
    const teacher = await Teacher.findOne({ tokens: token });
    if (!teacher) return res.redirect('/teacher/login')
    req.teacher = teacher
    next();
  } catch (err) {console.log(err)};
};
module.exports = auth;
