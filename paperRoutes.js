const express = require("express");

const {
    submitPaper,
    getMyPapers
} = require("../controllers/paperController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/submit",
    authenticateToken,
    authorizeRoles("Author"),
    submitPaper
);

router.get(
    "/my-papers",
    authenticateToken,
    authorizeRoles("Author"),
    getMyPapers
);

module.exports = router;