const pool = require("../config/db");

const getTracks = async (req, res) => {
    try {
        const [tracks] = await pool.execute("SELECT track_id, name FROM tracks ORDER BY name");
        return res.json(tracks);
    } catch (error) {
        console.error("Get tracks error:", error);
        return res.status(500).json({ message: "Failed to fetch tracks", error: error.message });
    }
};

const getImportantDates = async (req, res) => {
    try {
        const [dates] = await pool.execute("SELECT date_id, label, event_date, note FROM important_dates ORDER BY event_date");
        return res.json(dates);
    } catch (error) {
        console.error("Get dates error:", error);
        return res.status(500).json({ message: "Failed to fetch dates", error: error.message });
    }
};

const getSessions = async (req, res) => {
    try {
        const [sessions] = await pool.execute(
            `SELECT s.paper_id, s.day_no, s.time_slot, s.room,
                    p.title, p.abstract, u.full_name AS author, t.name AS track
             FROM sessions s
             JOIN papers p ON p.paper_id = s.paper_id
             JOIN users u ON u.user_id = p.author_id
             LEFT JOIN tracks t ON t.track_id = p.track_id
             ORDER BY s.day_no, s.time_slot, s.room`
        );
        return res.json(sessions);
    } catch (error) {
        console.error("Get sessions error:", error);
        return res.status(500).json({ message: "Failed to fetch sessions", error: error.message });
    }
};

const assignSession = async (req, res) => {
    try {
        const { paper_id, day_no, time_slot, room } = req.body;

        if (!paper_id || !day_no || !time_slot || !room) {
            return res.status(400).json({
                message: "Paper ID, day_no, time_slot, and room are required"
            });
        }

        // Check if slot is taken by another paper
        const [clash] = await pool.execute(
            "SELECT paper_id FROM sessions WHERE day_no = ? AND time_slot = ? AND room = ? AND paper_id <> ?",
            [day_no, time_slot, room, paper_id]
        );

        if (clash && clash.length > 0) {
            return res.status(409).json({
                message: `This time slot and room are already allocated to Paper #${clash[0].paper_id}`
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO sessions (paper_id, day_no, time_slot, room)
             VALUES (?, ?, ?, ?)
             ON CONFLICT (paper_id)
             DO UPDATE SET day_no = EXCLUDED.day_no, time_slot = EXCLUDED.time_slot, room = EXCLUDED.room
             RETURNING paper_id, day_no, time_slot, room`,
            [paper_id, day_no, time_slot, room]
        );

        return res.status(200).json({
            message: "Session scheduled successfully",
            session: result[0]
        });

    } catch (error) {
        console.error("Assign session error:", error);
        return res.status(500).json({
            message: "Failed to assign session",
            error: error.message
        });
    }
};

const getAnnouncements = async (req, res) => {
    try {
        const [announcements] = await pool.execute(
            `SELECT a.announcement_id, a.title, a.message, a.posted_on, u.full_name AS posted_by
             FROM announcements a
             JOIN users u ON u.user_id = a.posted_by
             ORDER BY a.announcement_id DESC`
        );
        return res.json(announcements);
    } catch (error) {
        console.error("Get announcements error:", error);
        return res.status(500).json({ message: "Failed to fetch announcements", error: error.message });
    }
};

const createAnnouncement = async (req, res) => {
    try {
        const { title, message } = req.body;
        const posted_by = req.user.user_id;

        if (!title || !message) {
            return res.status(400).json({ message: "Title and message are required" });
        }

        const [result] = await pool.execute(
            `INSERT INTO announcements (title, message, posted_by, posted_on)
             VALUES (?, ?, ?, CURRENT_DATE)
             RETURNING announcement_id, title, message, posted_by, posted_on`,
            [title.trim(), message.trim(), posted_by]
        );

        return res.status(201).json({
            message: "Announcement posted successfully",
            announcement: result[0]
        });

    } catch (error) {
        console.error("Create announcement error:", error);
        return res.status(500).json({ message: "Failed to post announcement", error: error.message });
    }
};

module.exports = {
    getTracks,
    getImportantDates,
    getSessions,
    assignSession,
    getAnnouncements,
    createAnnouncement
};
