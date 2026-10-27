const pool = require("../config/db");

const generateCertificate = async (req, res) => {
    try {
        const { transaction_id } = req.body;
        const user_id = req.user.user_id;

        const [rows] = await pool.execute(
            `SELECT g.transaction_id, g.participant_name, g.institution, p.title AS paper, tt.label AS ticket, g.registered_on
             FROM registrations g
             JOIN papers p ON p.paper_id = g.paper_id
             JOIN ticket_types tt ON tt.ticket_type_id = g.ticket_type_id
             WHERE g.user_id = ? AND g.transaction_id = ?`,
            [user_id, transaction_id]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "Registration certificate not found" });
        }

        return res.json({
            message: "Certificate generated successfully",
            certificate: rows[0]
        });

    } catch (error) {
        console.error("Generate certificate error:", error);
        return res.status(500).json({ message: "Failed to generate certificate", error: error.message });
    }
};

const getMyCertificates = async (req, res) => {
    try {
        const user_id = req.user.user_id;

        const [rows] = await pool.execute(
            `SELECT g.transaction_id, g.participant_name, g.institution, p.title AS paper, tt.label AS ticket, g.registered_on
             FROM registrations g
             JOIN papers p ON p.paper_id = g.paper_id
             JOIN ticket_types tt ON tt.ticket_type_id = g.ticket_type_id
             WHERE g.user_id = ?`,
            [user_id]
        );

        return res.json(rows);

    } catch (error) {
        console.error("Get certificates error:", error);
        return res.status(500).json({ message: "Failed to fetch certificates", error: error.message });
    }
};

module.exports = {
    generateCertificate,
    getMyCertificates
};
