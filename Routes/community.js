const express = require("express");
router = express.Router();
const { auth, adminAuth, isOwnerOrAdmin } = require("../Middleware/auth");
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

router.post("/createPost", auth, createPost);
router.delete("/deletePost/:post_id", auth, deletePost); //อาจจะต่างกับทีน
router.put("/updatePost/:post_id", updatePost);
router.get("/getPost", getPost);
// router.get("/getPostByID/:post_id", getPostById);
//teenทำเพิ่ม
router.post("/postReaction", auth, postReaction);
router.post("/reportPost/:post_id", auth, reportPost);
router.get("/getPostByPostId/:post_id", getPostByPostId);
router.post("/createComment", auth, createComment);
router.get("/getCommentByPost/:post_id", getCommentByPost);
router.post("/commentReaction", auth, commentReaction);
router.post("/reportComment/:comment_id", auth, reportComment);
router.delete("/deleteComment/:comment_id", auth, deleteComment);
module.exports = router;
