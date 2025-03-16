const express = require("express");
router = express.Router();
const { createPost,deletePost,updatePost,getPost,getPostById} = require("../Controllers/community");

router.post("/createPost/:user_id", createPost);
router.delete("/deletePost/:post_id", deletePost);
router.put("/updatePost/:post_id", updatePost);
router.get("/getPost", getPost);
router.get("/getPostByID/:post_id", getPostById);
module.exports = router