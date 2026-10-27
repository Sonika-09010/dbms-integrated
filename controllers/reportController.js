const pool = require("../config/db");

const getDashboard = async (req, res) => {
    try {
        const [paperStats] = await pool.execute(`
            SELECT 
                COUNT(*) AS total_papers,
                SUM(CASE WHEN status = 'Accepted' AND organizer_approved THEN 1 ELSE 0 END) AS accepted_papers,
                SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) AS under_review,
                SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected_papers
            FROM papers
        `);

        const [regStats] = await pool.execute(`
            SELECT 
                COUNT(*) AS registered_participants,
                COALESCE(SUM(amount_paid), 0) AS total_revenue,
                SUM(CASE WHEN checked_in THEN 1 ELSE 0 END) AS checked_in_count
            FROM registrations
        `);

        const [reviewStats] = await pool.execute(`
            SELECT 
                COUNT(*) AS total_reviews,
                ROUND(AVG(score), 1) AS avg_score
            FROM reviews
        `);

        const [sessionStats] = await pool.execute(`
            SELECT COUNT(*) AS total_sessions FROM sessions
        `);

        const [trackStats] = await pool.execute(`
            SELECT t.name AS track, COUNT(p.paper_id) AS papers
            FROM tracks t
            LEFT JOIN papers p ON p.track_id = t.track_id
            GROUP BY t.track_id, t.name
            ORDER BY papers DESC
        `);

        return res.json({
            message: "Dashboard summary data",
            data: {
                total_papers: Number(paperStats[0].total_papers || 0),
                accepted_papers: Number(paperStats[0].accepted_papers || 0),
                under_review: Number(paperStats[0].under_review || 0),
                rejected_papers: Number(paperStats[0].rejected_papers || 0),
                registered_participants: Number(regStats[0].registered_participants || 0),
                total_revenue: Number(regStats[0].total_revenue || 0),
                checked_in: Number(regStats[0].checked_in_count || 0),
                total_reviews: Number(reviewStats[0].total_reviews || 0),
                avg_score: Number(reviewStats[0].avg_score || 0),
                total_sessions: Number(sessionStats[0].total_sessions || 0),
                track_breakdown: trackStats
            }
        });

    } catch (error) {
        console.error("Dashboard report error:", error);
        return res.status(500).json({
            message: "Failed to fetch dashboard data",
            error: error.message
        });
    }
};

const getPaperReport = async (req, res) => {
    try {
        const [statusBreakdown] = await pool.execute(`
            SELECT status, COUNT(*) AS count
            FROM papers
            GROUP BY status
        `);

        const [trackBreakdown] = await pool.execute(`
            SELECT t.name, COUNT(p.paper_id) AS papers
            FROM tracks t
            LEFT JOIN papers p ON p.track_id = t.track_id
            GROUP BY t.track_id, t.name
        `);

        return res.json({
            message: "Paper report",
            data: {
                status_breakdown: statusBreakdown,
                track_breakdown: trackBreakdown
            }
        });

    } catch (error) {
        console.error("Paper report error:", error);
        return res.status(500).json({
            message: "Failed to generate paper report",
            error: error.message
        });
    }
};

const getRegistrationReport = async (req, res) => {
    try {
        const [byTicket] = await pool.execute(`
            SELECT tt.label, COUNT(g.transaction_id) AS registrations, COALESCE(SUM(g.amount_paid), 0) AS revenue
            FROM ticket_types tt
            LEFT JOIN registrations g ON g.ticket_type_id = tt.ticket_type_id
            GROUP BY tt.ticket_type_id, tt.label
        `);

        return res.json({
            message: "Registration report",
            data: {
                ticket_breakdown: byTicket
            }
        });

    } catch (error) {
        console.error("Registration report error:", error);
        return res.status(500).json({
            message: "Failed to generate registration report",
            error: error.message
        });
    }
};

module.exports = {
    getDashboard,
    getPaperReport,
    getRegistrationReport
};
