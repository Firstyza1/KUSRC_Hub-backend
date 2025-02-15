const express = require('express')
router = express.Router()
const {sendOTP,register,login,forgotPassword,resetPassword,verifyOTP} = require('../Controllers/auth')

router.post('/sendOTP',sendOTP);
router.post('/register',register);
router.post('/login',login);
router.post('/forgotPassword',forgotPassword);
router.post('/resetPassword',resetPassword);
router.post('/verifyOTP',verifyOTP);
module.exports = router