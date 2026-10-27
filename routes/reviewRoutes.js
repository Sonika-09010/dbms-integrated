const express = require("express");

const {
    submitReview,
    getAssignedReviews,
    getReviewHistory
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

router.get(
    "/history",
    authenticateToken,
    authorizeRoles("Reviewer"),
    getReviewHistory
);

module.exports = router;
