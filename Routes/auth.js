const express = require('express')
router = express.Router()
const {sendOTP,register,login,forgotPassword,resetPassword,verifyOTP} = require('../Controllers/auth')
const {auth} = require('../Middleware/auth'); 
router.post('/sendOTP',sendOTP);
router.post('/register',register);
router.post('/login',login);
router.post('/forgotPassword',forgotPassword);
router.post('/resetPassword',resetPassword);
router.post('/verifyOTP',verifyOTP);


router.get('/verify-token', auth, (req, res) => {
    res.status(200).send({ message: "Token is valid", user: req.user });
  });
module.exports = router