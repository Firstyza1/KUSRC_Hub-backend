const express = require("express");
router = express.Router();
const {
  getAllReviews,
  getAllReportedReview,
  deleteReportedReview,
  getAllReportedPost,
  deleteReportedPost,
  getAllReportedComment,
  deleteReportedComment,
  getCountStats,
  getUserGrowth,
  getSubjectGrowth,
  getReviewGrowth,
  getPostGrowth
} = require("../Controllers/admin");
router.get("/getAllReview", getAllReviews);
router.get("/getAllReportedReview", getAllReportedReview);
router.delete("/deleteReportedReview/:report_id", deleteReportedReview);
router.get("/getAllReportedPost", getAllReportedPost);
router.delete("/deleteReportedPost/:report_id", deleteReportedPost);
router.get("/getAllReportedComment", getAllReportedComment);
router.delete("/deleteReportedComment/:report_id", deleteReportedComment);
router.get("/getCountTotal", getCountStats);
router.get("/getUserGrowth", getUserGrowth);
router.get("/getSubjectGrowth", getSubjectGrowth);
router.get("/getReviewGrowth", getReviewGrowth);
router.get("/getPostGrowth", getPostGrowth);
module.exports = router;
