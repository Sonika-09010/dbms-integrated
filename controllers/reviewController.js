const pool = require("../config/db");

const submitReview = async (req, res) => {
    try {
        const {
            paper_id,
            score,
            confidence = 4,
            comments
        } = req.body;

        if (!paper_id || score === undefined || !comments) {
            return res.status(400).json({
                message: "Paper ID, score, and comments are required"
            });
        }

        const numScore = Math.max(1, Math.min(5, Math.round(Number(score))));
        const reviewer_id = req.user.user_id;

        // Upsert review (allows reviewer to update their review if submitted again)
        const [reviewResult] = await pool.execute(
            `INSERT INTO reviews (paper_id, reviewer_id, score, confidence, comments, reviewed_on)
             VALUES (?, ?, ?, ?, ?, CURRENT_DATE)
             ON CONFLICT (paper_id, reviewer_id)
             DO UPDATE SET score = EXCLUDED.score, 
                           confidence = EXCLUDED.confidence, 
                           comments = EXCLUDED.comments, 
                           reviewed_on = CURRENT_DATE
             RETURNING review_id, paper_id, reviewer_id, score, confidence, comments, reviewed_on`,
            [paper_id, reviewer_id, numScore, confidence || null, comments.trim()]
        );

        // Update paper status based on score if organizer hasn't made a final decision yet
        const newStatus = numScore >= 3 ? 'Reviewer Accepted' : 'Rejected';
        await pool.execute(
            `UPDATE papers 
             SET status = ? 
             WHERE paper_id = ? AND final_decision IS NULL`,
            [newStatus, paper_id]
        );

        return res.status(201).json({
            message: "Review submitted successfully",
            review: reviewResult[0]
        });

    } catch (error) {
        console.error("Submit review error:", error);
        return res.status(500).json({
            message: "Review submission failed",
            error: error.message
        });
    }
};

const getAssignedReviews = async (req, res) => {
    try {
        const reviewer_id = req.user.user_id;

        // Get all papers with evaluated status for this reviewer
        const [queue] = await pool.execute(
            `SELECT p.paper_id, p.title, p.abstract, p.status, t.name AS track, u.full_name AS author,
                    (mine.review_id IS NOT NULL) AS evaluated,
                    mine.score, mine.confidence, mine.comments, mine.reviewed_on
             FROM papers p
             JOIN users u ON u.user_id = p.author_id
             LEFT JOIN tracks t ON t.track_id = p.track_id
             LEFT JOIN reviews mine ON mine.paper_id = p.paper_id AND mine.reviewer_id = ?
             ORDER BY evaluated ASC, p.paper_id ASC`,
            [reviewer_id]
        );

        return res.json(queue);

    } catch (error) {
        console.error("Get assigned reviews error:", error);
        return res.status(500).json({
            message: "Failed to fetch reviewer queue",
            error: error.message
        });
    }
};

const getReviewHistory = async (req, res) => {
    try {
        const reviewer_id = req.user.user_id;

        const [history] = await pool.execute(
            `SELECT r.review_id, r.paper_id, p.title AS paper_title, r.score, r.confidence, 
                    r.comments, r.reviewed_on AS date, u.full_name AS reviewer
             FROM reviews r
             JOIN papers p ON p.paper_id = r.paper_id
             JOIN users u ON u.user_id = r.reviewer_id
             WHERE r.reviewer_id = ?
             ORDER BY r.reviewed_on DESC, r.review_id DESC`,
            [reviewer_id]
        );

        return res.json(history);

    } catch (error) {
        console.error("Get review history error:", error);
        return res.status(500).json({
            message: "Failed to fetch review history",
            error: error.message
        });
    }
};

module.exports = {
    submitReview,
    getAssignedReviews,
    getReviewHistory
};
