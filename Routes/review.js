const express = require("express");
router = express.Router();
const { requestSubject, getSubject } = require("../Controllers/review");

router.post("/requestSubject", requestSubject);
router.get("/getSubject", getSubject);
module.exports = router;
