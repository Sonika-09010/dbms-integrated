const express = require("express");

const {
    submitPaper,
    getMyPapers,
    getAllPapers,
    updatePaperDecision
} = require("../controllers/paperController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getAllPapers);

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

router.patch(
    "/:id/decision",
    authenticateToken,
    authorizeRoles("Organizer"),
    updatePaperDecision
);

module.exports = router;
