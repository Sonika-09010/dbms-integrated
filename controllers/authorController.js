const pool = require("../config/db");

const addCoAuthor = async (req, res) => {
    try {
        const { paper_id, co_author_name } = req.body;

        if (!paper_id || !co_author_name) {
            return res.status(400).json({
                message: "Paper ID and co-author name are required"
            });
        }

        const [paper] = await pool.execute(
            "SELECT author_id, co_authors FROM papers WHERE paper_id = ?",
            [paper_id]
        );

        if (!paper || paper.length === 0) {
            return res.status(404).json({ message: "Paper not found" });
        }

        if (paper[0].author_id !== req.user.user_id && req.user.role !== 'Organizer') {
            return res.status(403).json({ message: "Not authorized to modify this paper" });
        }

        const current = paper[0].co_authors ? paper[0].co_authors.split(",").map(c => c.trim()) : [];
        if (!current.includes(co_author_name.trim())) {
            current.push(co_author_name.trim());
        }

        const updatedString = current.join(", ");

        await pool.execute(
            "UPDATE papers SET co_authors = ? WHERE paper_id = ?",
            [updatedString, paper_id]
        );

        return res.json({
            message: "Co-author added successfully",
            co_authors: updatedString
        });

    } catch (error) {
        console.error("Add co-author error:", error);
        return res.status(500).json({
            message: "Failed to add co-author",
            error: error.message
        });
    }
};

const getPaperAuthors = async (req, res) => {
    try {
        const { paper_id } = req.params;

        const [paper] = await pool.execute(
            `SELECT p.paper_id, p.title, p.co_authors, u.full_name AS primary_author, u.email
             FROM papers p
             JOIN users u ON u.user_id = p.author_id
             WHERE p.paper_id = ?`,
            [paper_id]
        );

        if (!paper || paper.length === 0) {
            return res.status(404).json({ message: "Paper not found" });
        }

        return res.json({
            paper_id: paper[0].paper_id,
            title: paper[0].title,
            primary_author: paper[0].primary_author,
            email: paper[0].email,
            co_authors: paper[0].co_authors ? paper[0].co_authors.split(",").map(s => s.trim()) : []
        });

    } catch (error) {
        console.error("Get paper authors error:", error);
        return res.status(500).json({
            message: "Failed to fetch paper authors",
            error: error.message
        });
    }
};

module.exports = {
    addCoAuthor,
    getPaperAuthors
};
