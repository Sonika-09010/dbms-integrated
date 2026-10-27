const submitPaper = async (req, res) => {
    try {
        const { title, abstract, paper_file } = req.body;

        if (!title || !abstract || !paper_file) {
            return res.status(400).json({
                message: "Title, abstract and paper file are required"
            });
        }

        res.status(201).json({
            message: "Paper submission received",
            submitted_by: req.user.user_id,
            paper: {
                title,
                abstract,
                paper_file
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Paper submission failed"
        });
    }
};

const getMyPapers = async (req, res) => {
    try {
        // MOCK DATA TO BYPASS DATABASE FOR TESTING
        res.json([
            {
                paper_id: 1,
                title: "AI in Database Management Systems",
                abstract: "This paper explores the integration of artificial intelligence in modern relational database management systems, focusing on automated query optimization and predictive indexing.",
                status: "Submitted",
                submission_date: "2026-10-26",
                author_id: 1
            }
        ]);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch papers"
        });
    }
};

module.exports = {
    submitPaper,
    getMyPapers
};