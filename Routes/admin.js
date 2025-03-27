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
  // getCountStats,
  // getUserGrowth,
  // getSubjectGrowth,
  // getReviewGrowth,
  // getPostGrowth,
  getAllPost,
  getAllStats,
} = require("../Controllers/admin");
const { auth, adminAuth, isOwnerOrAdmin } = require("../Middleware/auth");

router.get("/getAllReview", getAllReviews);
router.get("/getAllReportedReview", getAllReportedReview);
router.delete(
  "/deleteReportedReview/:report_id",
  auth,
  adminAuth,
  deleteReportedReview
);
router.get("/getAllReportedPost", getAllReportedPost);
router.delete(
  "/deleteReportedPost/:report_id",
  auth,
  adminAuth,
  deleteReportedPost
);
router.get("/getAllReportedComment", getAllReportedComment);
router.delete(
  "/deleteReportedComment/:report_id",
  auth,
  adminAuth,
  deleteReportedComment
);
// router.get("/getCountTotal", getCountStats);
// router.get("/getUserGrowth", getUserGrowth);
// router.get("/getSubjectGrowth", getSubjectGrowth);
// router.get("/getReviewGrowth", getReviewGrowth);
// router.get("/getPostGrowth", getPostGrowth);
router.get("/getAllPost", getAllPost);
router.get("/getAllStats", getAllStats);
module.exports = router;
