const submitReview = async (req, res) => {
    try {
        const {
            paper_id,
            score,
            comments,
            recommendation
        } = req.body;

        if (
            !paper_id ||
            score === undefined ||
            !comments ||
            !recommendation
        ) {
            return res.status(400).json({
                message:
                    "Paper ID, score, comments and recommendation are required"
            });
        }

        if (Number(score) < 0 || Number(score) > 10) {
            return res.status(400).json({
                message: "Score must be between 0 and 10"
            });
        }

        const validRecommendations = [
            "Accept",
            "Reject",
            "Revise"
        ];

        if (!validRecommendations.includes(recommendation)) {
            return res.status(400).json({
                message: "Invalid recommendation"
            });
        }

        res.status(201).json({
            message: "Review submitted successfully",
            review: {
                paper_id,
                reviewer_id: req.user.user_id,
                score: Number(score),
                comments,
                recommendation,
                status: "Submitted"
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Review submission failed"
        });
    }
};

const getAssignedReviews = async (req, res) => {
    try {
        res.json({
            message: "Assigned reviews endpoint",
            reviewer_id: req.user.user_id,
            reviews: []
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch assigned reviews"
        });
    }
};

const assignReviewer = async (req, res) => {
    try {
        const {
            paper_id,
            reviewer_id
        } = req.body;

        if (!paper_id || !reviewer_id) {
            return res.status(400).json({
                message: "Paper ID and reviewer ID are required"
            });
        }

        res.status(201).json({
            message: "Reviewer assignment received",
            assignment: {
                paper_id,
                reviewer_id,
                status: "Assigned"
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Reviewer assignment failed"
        });
    }
};

const updatePaperDecision = async (req, res) => {
    try {
        const {
            paper_id,
            decision
        } = req.body;

        if (!paper_id || !decision) {
            return res.status(400).json({
                message: "Paper ID and decision are required"
            });
        }

        const validDecisions = [
            "Accept",
            "Reject"
        ];

        if (!validDecisions.includes(decision)) {
            return res.status(400).json({
                message: "Decision must be Accept or Reject"
            });
        }

        res.json({
            message: "Paper decision received",
            decision: {
                paper_id,
                decision,
                updated_by: req.user.user_id
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update paper decision"
        });
    }
};

module.exports = {
    submitReview,
    getAssignedReviews,
    assignReviewer,
    updatePaperDecision
};