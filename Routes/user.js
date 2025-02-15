const express = require("express");
const { userProfile,updateUserProfile } = require("../Controllers/user");
const { upload } = require('../Middleware/upload')
router = express.Router();

router.get("/userProfile/:user_id", userProfile);
router.put("/updateUserProfile/:user_id", upload, updateUserProfile);
module.exports = router