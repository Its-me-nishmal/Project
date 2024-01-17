const Teacher = require('../model/Teachers');
const auth = async (req, res, next) => {
  try {
    const token = req.cookies.teacher_token;
    if (!token) return res.redirect("/login")
    const teacher = await Teacher.findOne({ tokens: token });
  
    if (!teacher) return res.redirect('/login')
    console.log('t',teacher)
    req.teacher = teacher
    next();
  } catch (err) {console.log(err)};
};
module.exports = auth;
