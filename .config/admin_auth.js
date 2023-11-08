const Admin = require('../model/Admin');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.admin_token;
    const admin = await Admin.findOne({ tokens: token });
    if (!admin) return res.redirect('/admin/login')
    req.admin = admin
    next();
  } catch (err) {console.log(err)};
};
module.exports = auth;
