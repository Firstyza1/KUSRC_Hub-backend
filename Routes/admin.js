const express = require("express");
router = express.Router();
const { auth,adminAuth,isOwnerOrAdmin } = require('../Middleware/auth')
const {
  getAllReviews,
  getAllReportedReview,
  deleteReportedReview,
  getAllReportedPost,
  deleteReportedPost,
  getAllReportedComment,
  deleteReportedComment,
  getAllStats
} = require("../Controllers/admin");
router.get("/getAllReview",auth,adminAuth,getAllReviews);
router.get("/getAllReportedReview", getAllReportedReview);
router.delete("/deleteReportedReview/:report_id", deleteReportedReview);
router.get("/getAllReportedPost", getAllReportedPost);
router.delete("/deleteReportedPost/:report_id", deleteReportedPost);
router.get("/getAllReportedComment", getAllReportedComment);
router.delete("/deleteReportedComment/:report_id", deleteReportedComment);
// router.get("/getCountTotal", getCountStats);
// router.get("/getUserGrowth", getUserGrowth);
// router.get("/getSubjectGrowth", getSubjectGrowth);
// router.get("/getReviewGrowth", getReviewGrowth);
// router.get("/getPostGrowth", getPostGrowth);
router.get("/getAllStats", getAllStats);
module.exports = router;
