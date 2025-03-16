const express = require("express");
router = express.Router();
const { requestSubject, getSubject, deleteSubject,getSubjectById,updateSubject,deleteReview } = require("../Controllers/review");

router.post("/requestSubject", requestSubject);
router.get("/getSubject", getSubject);
router.delete("/deleteSubject/:subject_id", deleteSubject); 
router.get("/getSubjectByID/:subject_id", getSubjectById);
router.put("/updateSubject/:subject_id", updateSubject);
router.delete("/deleteReview/:review_id", deleteReview);
module.exports = router;
