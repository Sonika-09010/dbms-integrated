const express = require("express");

const {
    summarize,
    sessionRecommendation,
    reviewerRecommendation
} = require("../controllers/aiController");

const authenticateToken = require("../middleware/authMiddleware");

const { suggestReviewers } = require("../aiService");

const router = express.Router();

router.post(
    "/summarize",
    authenticateToken,
    summarize
);

router.post(
    "/session-recommendation",
    authenticateToken,
    sessionRecommendation
);

router.post(
    "/reviewer-recommendation",
    authenticateToken,
    reviewerRecommendation
);

// POST /api/ai/suggest-reviewers
// Body: { keywords: string | string[] }
// Returns top-3 reviewer suggestions based on keyword matching.
router.post("/suggest-reviewers", authenticateToken, (req, res) => {
    try {
        const { keywords } = req.body;
        if (!keywords) {
            return res.status(400).json({ message: "keywords is required" });
        }
        const reviewers = suggestReviewers(keywords);
        res.json({ message: "Reviewer suggestions generated", reviewers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to suggest reviewers" });
    }
});

module.exports = router;
