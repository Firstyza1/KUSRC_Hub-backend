const express = require("express");
router = express.Router();
const {
  createPost,
  deletePost,
  updatePost,
  getPost,
  getPostById,
  postReaction,
  reportPost,
  getPostByPostId,
  createComment,
  getCommentByPost,
  commentReaction,
  reportComment,
  deleteComment,
} = require("../Controllers/community");

router.post("/createPost/:user_id", createPost);
router.delete("/deletePost/:post_id", deletePost); //อาจจะต่างกับทีน
router.put("/updatePost/:post_id", updatePost);
router.get("/getPost", getPost);
// router.get("/getPostByID/:post_id", getPostById);
//teenทำเพิ่ม
router.post("/postReaction", postReaction);
router.post("/reportPost/:post_id", reportPost);
router.get("/getPostByPostId/:post_id", getPostByPostId);
router.post("/createComment", createComment);
router.get("/getCommentByPost/:post_id", getCommentByPost);
router.post("/commentReaction", commentReaction);
router.post("/reportComment/:comment_id", reportComment);
router.delete("/deleteComment/:comment_id", deleteComment);
module.exports = router;
