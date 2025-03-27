const express = require("express");
const { uploadPDF } = require("../Middleware/upload.js");
router = express.Router();
const {
  requestSubject,
  getSubject,
  deleteSubject,
  getSubjectById,
  updateSubject,
  deleteReview,
  //   getSubjectById,
  createReview,
  getReview,
  reviewReactions,
  postPDF,
  getReviewById,
  reportReview,
  getSubjectMain,
} = require("../Controllers/review");
const { auth, adminAuth, isOwnerOrAdmin } = require("../Middleware/auth");

router.post("/requestSubject", auth, adminAuth, requestSubject);
router.get("/Subjects", getSubject);
router.delete("/deleteSubject/:subject_id", auth, adminAuth, deleteSubject);
// router.get("/getSubjectByID/:subject_id", getSubjectById);
router.put("/updateSubject/:subject_id", auth, adminAuth, updateSubject);
router.delete("/deleteReview/:review_id", auth, deleteReview); //อาจจะต่างจากทีน

//ทีนทำเพิ่ม
router.get("/Subjects/:subject_id", getSubjectById);
router.post("/createReview", auth, uploadPDF, createReview);
router.get("/getReview/:subject_id", getReview);
router.post("/reviewReactions", auth, reviewReactions);
// router.post("/postPDF", uploadPDF, postPDF);
router.get("/getReviewById/:review_id", getReviewById);
router.post("/reportReview/:review_id", auth, reportReview);
router.get("/getSubjectMain", getSubjectMain);
module.exports = router;
