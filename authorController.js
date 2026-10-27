const addCoAuthor = async (req, res) => {
    try {
        const { paper_id, author_id } = req.body;

        if (!paper_id || !author_id) {
            return res.status(400).json({
                message: "Paper ID and author ID are required"
            });
        }

        res.status(201).json({
            message: "Co-author addition received",
            author: {
                paper_id,
                author_id,
                added_by: req.user.user_id
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to add co-author"
        });
    }
};

const getPaperAuthors = async (req, res) => {
    try {
        const { paper_id } = req.params;

        if (!paper_id) {
            return res.status(400).json({
                message: "Paper ID is required"
            });
        }

        res.json({
            message: "Paper authors endpoint",
            paper_id,
            authors: []
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch paper authors"
        });
    }
};

module.exports = {
    addCoAuthor,
    getPaperAuthors
};