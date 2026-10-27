const {
    summarizePaper,
    recommendSession,
    recommendReviewer
} = require("../services/aiService");

const summarize = async (req, res) => {
    try {
        const { paperText } = req.body;

        if (!paperText) {
            return res.status(400).json({
                message: "Paper text is required"
            });
        }

        const summary = await summarizePaper(paperText);

        res.json({
            message: "Paper summarized successfully",
            summary
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to summarize paper"
        });
    }
};

const sessionRecommendation = async (req, res) => {
    try {
        const { paperTitle, paperAbstract } = req.body;

        if (!paperTitle || !paperAbstract) {
            return res.status(400).json({
                message: "Paper title and abstract are required"
            });
        }

        const recommendation = await recommendSession(
            paperTitle,
            paperAbstract
        );

        res.json({
            message: "Session recommendation generated successfully",
            recommendation
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to generate session recommendation"
        });
    }
};

const reviewerRecommendation = async (req, res) => {
    try {
        const {
            paperTitle,
            paperAbstract,
            reviewerExpertise
        } = req.body;

        if (!paperTitle || !paperAbstract || !reviewerExpertise) {
            return res.status(400).json({
                message:
                    "Paper title, abstract and reviewer expertise are required"
            });
        }

        const recommendation = await recommendReviewer(
            paperTitle,
            paperAbstract,
            reviewerExpertise
        );

        res.json({
            message: "Reviewer recommendation generated successfully",
            recommendation
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to generate reviewer recommendation"
        });
    }
};

module.exports = {
    summarize,
    sessionRecommendation,
    reviewerRecommendation
};