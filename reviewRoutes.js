const express = require("express");

const {
    submitReview,
    getAssignedReviews,
    assignReviewer,
    updatePaperDecision
} = require("../controllers/reviewController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/submit",
    authenticateToken,
    authorizeRoles("Reviewer"),
    submitReview
);

router.get(
    "/assigned",
    authenticateToken,
    authorizeRoles("Reviewer"),
    getAssignedReviews
);

router.post(
    "/assign",
    authenticateToken,
    authorizeRoles("Author"),
    assignReviewer
);

router.put(
    "/decision",
    authenticateToken,
    authorizeRoles("Author"),
    updatePaperDecision
);

module.exports = router;