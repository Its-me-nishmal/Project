const Admin = require('../model/Admin');
const mongodb = require('../.config/dbconnect')

const auth = async (req, res, next) => {
  try {
    await mongodb()
    const token = req.cookies.admin_token;
    const admin = await Admin.findOne({ tokens: token });
    if (!admin) return res.redirect('/admin/login')
    req.admin = admin
    next();
  } catch (err) {console.log(err)};
};
module.exports = auth;
