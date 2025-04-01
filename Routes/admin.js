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
  getAllPost,
  getAllStats,
  createSubject,
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
router.get("/getAllPost", getAllPost);
router.get("/getAllStats", getAllStats);
router.post("/createSubject", createSubject);
module.exports = router;
