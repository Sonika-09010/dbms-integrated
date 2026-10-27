const {
    checkPlagiarism
} = require("../services/plagiarismService");

const checkPaperPlagiarism = async (req, res) => {
    try {
        const {
            paperText,
            existingTexts
        } = req.body;

        if (!paperText) {
            return res.status(400).json({
                message: "Paper text is required"
            });
        }

        if (
            existingTexts !== undefined &&
            !Array.isArray(existingTexts)
        ) {
            return res.status(400).json({
                message: "Existing texts must be an array"
            });
        }

        const result = checkPlagiarism(
            paperText,
            existingTexts || []
        );

        res.json({
            message: "Plagiarism check completed",
            result
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Plagiarism check failed"
        });
    }
};

module.exports = {
    checkPaperPlagiarism
};