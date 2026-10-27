const express = require("express");

const {
    checkPaperPlagiarism
} = require("../controllers/plagiarismController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/check",
    authenticateToken,
    checkPaperPlagiarism
);

module.exports = router;