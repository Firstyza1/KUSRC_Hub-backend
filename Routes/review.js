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
  createReview,getReview,reviewReactions,postPDF,getReaction, getReviewById,reportReview
} = require("../Controllers/review");

router.post("/requestSubject", requestSubject);
router.get("/Subjects", getSubject);
router.delete("/deleteSubject/:subject_id", deleteSubject);
// router.get("/getSubjectByID/:subject_id", getSubjectById);
router.put("/updateSubject/:subject_id", updateSubject);
router.delete("/deleteReview/:review_id", deleteReview); //อาจจะต่างจากทีน

//ทีนทำเพิ่ม
router.get("/Subjects/:subject_id", getSubjectById);
router.post("/createReview", uploadPDF, createReview);
router.get("/getReview/:subject_id", getReview);
router.post("/reviewReactions", reviewReactions);
// router.post("/postPDF", uploadPDF, postPDF);
router.get("/getReaction/:review_id", getReaction);
router.get("/getReviewById/:review_id", getReviewById);
router.post("/reportReview/:review_id", reportReview);
module.exports = router;
