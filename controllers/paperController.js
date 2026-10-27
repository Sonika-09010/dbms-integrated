const pool = require("../config/db");

const submitPaper = async (req, res) => {
    try {
        const {
            title,
            abstract,
            track,
            track_id,
            keywords = [],
            co_authors = "",
            file_name = "",
            conference_fee = 299.00
        } = req.body;

        if (!title || !abstract) {
            return res.status(400).json({
                message: "Title and abstract are required"
            });
        }

        const author_id = req.user.user_id;

        // Resolve track_id if track name was passed
        let targetTrackId = track_id || null;
        if (!targetTrackId && track) {
            const [trackRows] = await pool.execute(
                "SELECT track_id FROM tracks WHERE LOWER(name) LIKE LOWER(?) LIMIT 1",
                [`%${track.trim()}%`]
            );
            if (trackRows && trackRows.length > 0) {
                targetTrackId = trackRows[0].track_id;
            }
        }

        // Mock or initial similarity score (can be 0-15)
        const similarityScore = Math.floor(Math.random() * 12);

        const [insertResult] = await pool.execute(
            `INSERT INTO papers 
             (author_id, track_id, title, abstract, co_authors, file_name, similarity_score, conference_fee, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Under Review')
             RETURNING paper_id, author_id, track_id, title, abstract, co_authors, file_name, status, similarity_score, conference_fee, submitted_on`,
            [
                author_id,
                targetTrackId,
                title.trim(),
                abstract.trim(),
                co_authors,
                file_name || "manuscript.pdf",
                similarityScore,
                conference_fee
            ]
        );

        const newPaper = insertResult[0];

        // Insert keywords
        const kwList = Array.isArray(keywords) ? keywords : (typeof keywords === "string" ? keywords.split(",").map(k => k.trim()) : []);
        for (const kw of kwList) {
            if (kw) {
                await pool.execute(
                    "INSERT INTO paper_keywords (paper_id, keyword) VALUES (?, ?) ON CONFLICT DO NOTHING",
                    [newPaper.paper_id, kw]
                );
            }
        }

        return res.status(201).json({
            message: "Paper submitted successfully",
            paper: {
                ...newPaper,
                keywords: kwList
            }
        });

    } catch (error) {
        console.error("Submit paper error:", error);
        return res.status(500).json({
            message: "Paper submission failed",
            error: error.message
        });
    }
};

const getMyPapers = async (req, res) => {
    try {
        const author_id = req.user.user_id;

        const [papers] = await pool.execute(
            `SELECT p.paper_id, p.title, p.abstract, p.co_authors, p.file_name, p.status, 
                    p.final_decision, p.organizer_approved, p.similarity_score, p.conference_fee, p.submitted_on,
                    t.name AS track, u.full_name AS author_name, u.email AS author_email
             FROM papers p
             JOIN users u ON u.user_id = p.author_id
             LEFT JOIN tracks t ON t.track_id = p.track_id
             WHERE p.author_id = ?
             ORDER BY p.paper_id DESC`,
            [author_id]
        );

        // Fetch reviews and keywords for these papers
        const fullPapers = await Promise.all(
            papers.map(async (paper) => {
                const [kwRows] = await pool.execute(
                    "SELECT keyword FROM paper_keywords WHERE paper_id = ?",
                    [paper.paper_id]
                );
                const [rvRows] = await pool.execute(
                    `SELECT r.review_id, r.score, r.confidence, r.comments, r.reviewed_on, u.full_name AS reviewer
                     FROM reviews r
                     JOIN users u ON u.user_id = r.reviewer_id
                     WHERE r.paper_id = ?`,
                    [paper.paper_id]
                );

                return {
                    id: paper.paper_id,
                    paper_id: paper.paper_id,
                    title: paper.title,
                    abstract: paper.abstract,
                    track: paper.track || "General",
                    keywords: kwRows.map(k => k.keyword),
                    coAuthors: paper.co_authors,
                    authorName: paper.author_name,
                    authorEmail: paper.author_email,
                    status: paper.status,
                    organizerApproved: paper.organizer_approved,
                    plagiarismScore: paper.similarity_score,
                    conferenceFee: Number(paper.conference_fee),
                    submittedOn: paper.submitted_on,
                    reviews: rvRows.map(r => ({
                        reviewer: r.reviewer,
                        score: String(r.score),
                        comments: r.comments,
                        confidence: r.confidence,
                        date: r.reviewed_on
                    }))
                };
            })
        );

        return res.json(fullPapers);

    } catch (error) {
        console.error("Get my papers error:", error);
        return res.status(500).json({
            message: "Failed to fetch papers",
            error: error.message
        });
    }
};

const getAllPapers = async (req, res) => {
    try {
        const [papers] = await pool.execute(
            `SELECT p.paper_id, p.title, p.abstract, p.co_authors, p.file_name, p.status, 
                    p.final_decision, p.organizer_approved, p.similarity_score, p.conference_fee, p.submitted_on,
                    t.name AS track, u.full_name AS author_name, u.email AS author_email
             FROM papers p
             JOIN users u ON u.user_id = p.author_id
             LEFT JOIN tracks t ON t.track_id = p.track_id
             ORDER BY p.paper_id DESC`
        );

        const fullPapers = await Promise.all(
            papers.map(async (paper) => {
                const [kwRows] = await pool.execute(
                    "SELECT keyword FROM paper_keywords WHERE paper_id = ?",
                    [paper.paper_id]
                );
                const [rvRows] = await pool.execute(
                    `SELECT r.review_id, r.score, r.confidence, r.comments, r.reviewed_on, u.full_name AS reviewer
                     FROM reviews r
                     JOIN users u ON u.user_id = r.reviewer_id
                     WHERE r.paper_id = ?`,
                    [paper.paper_id]
                );

                return {
                    id: paper.paper_id,
                    paper_id: paper.paper_id,
                    title: paper.title,
                    abstract: paper.abstract,
                    track: paper.track || "General",
                    keywords: kwRows.map(k => k.keyword),
                    coAuthors: paper.co_authors,
                    authorName: paper.author_name,
                    authorEmail: paper.author_email,
                    status: paper.status,
                    organizerApproved: paper.organizer_approved,
                    plagiarismScore: paper.similarity_score,
                    conferenceFee: Number(paper.conference_fee),
                    submittedOn: paper.submitted_on,
                    reviews: rvRows.map(r => ({
                        reviewer: r.reviewer,
                        score: String(r.score),
                        comments: r.comments,
                        confidence: r.confidence,
                        date: r.reviewed_on
                    }))
                };
            })
        );

        return res.json(fullPapers);

    } catch (error) {
        console.error("Get all papers error:", error);
        return res.status(500).json({
            message: "Failed to fetch all papers",
            error: error.message
        });
    }
};

const updatePaperDecision = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision } = req.body; // 'Accepted' or 'Rejected'

        if (!['Accepted', 'Rejected'].includes(decision)) {
            return res.status(400).json({ message: "Decision must be 'Accepted' or 'Rejected'" });
        }

        const approved = decision === 'Accepted';

        const [result] = await pool.execute(
            `UPDATE papers
             SET status = ?, organizer_approved = ?, final_decision = ?
             WHERE paper_id = ?
             RETURNING paper_id, status, organizer_approved, final_decision`,
            [decision, approved, decision, id]
        );

        if (!result || result.length === 0) {
            return res.status(404).json({ message: "Paper not found" });
        }

        return res.json({
            message: `Paper ${decision}`,
            paper: result[0]
        });

    } catch (error) {
        console.error("Update paper decision error:", error);
        return res.status(500).json({
            message: "Failed to update decision",
            error: error.message
        });
    }
};

module.exports = {
    submitPaper,
    getMyPapers,
    getAllPapers,
    updatePaperDecision
};
