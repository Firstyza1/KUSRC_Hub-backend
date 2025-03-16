const express = require("express");
const { userProfile,updateUserProfile,deleteUser,getAllUsers} = require("../Controllers/user");
const { upload } = require('../Middleware/upload')
router = express.Router();
router.get("/getUser", getAllUsers);
router.get("/userProfile/:user_id", userProfile);
router.put("/updateUserProfile/:user_id", upload, updateUserProfile);
router.delete("/deleteUser/:user_id", deleteUser);
module.exports = router