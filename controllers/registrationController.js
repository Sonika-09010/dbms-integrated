const pool = require("../config/db");

const registerForConference = async (req, res) => {
    try {
        const {
            paper_id,
            ticket_type = 'academic',
            participant_name,
            institution,
            promo_code,
            amount_paid
        } = req.body;

        const user_id = req.user.user_id;

        if (!paper_id || !participant_name || !institution) {
            return res.status(400).json({
                message: "Paper ID, participant name, and institution are required"
            });
        }

        // Get ticket type id
        const [ticketRows] = await pool.execute(
            "SELECT ticket_type_id, factor FROM ticket_types WHERE LOWER(code) = LOWER(?) LIMIT 1",
            [ticket_type]
        );

        const ticketTypeId = ticketRows && ticketRows.length > 0 ? ticketRows[0].ticket_type_id : 1;

        // Generate transaction ID
        const transaction_id = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

        const finalAmount = amount_paid ? Number(amount_paid) : 299.00;

        const [regResult] = await pool.execute(
            `INSERT INTO registrations 
             (transaction_id, user_id, paper_id, ticket_type_id, participant_name, institution, promo_code, amount_paid, registered_on)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)
             RETURNING transaction_id, user_id, paper_id, ticket_type_id, participant_name, institution, promo_code, amount_paid, registered_on, checked_in`,
            [
                transaction_id,
                user_id,
                paper_id,
                ticketTypeId,
                participant_name.trim(),
                institution.trim(),
                promo_code || null,
                finalAmount
            ]
        );

        return res.status(201).json({
            message: "Conference registration successful",
            registration: regResult[0]
        });

    } catch (error) {
        console.error("Conference registration error:", error);
        return res.status(500).json({
            message: "Conference registration failed",
            error: error.message
        });
    }
};

const getMyRegistrations = async (req, res) => {
    try {
        const user_id = req.user.user_id;

        const [registrations] = await pool.execute(
            `SELECT g.transaction_id, g.participant_name, g.institution, g.amount_paid, g.promo_code, 
                    g.registered_on, g.checked_in, p.title AS paper, tt.label AS ticket
             FROM registrations g
             JOIN papers p ON p.paper_id = g.paper_id
             JOIN ticket_types tt ON tt.ticket_type_id = g.ticket_type_id
             WHERE g.user_id = ?
             ORDER BY g.registered_on DESC`,
            [user_id]
        );

        return res.json(registrations);

    } catch (error) {
        console.error("Get my registrations error:", error);
        return res.status(500).json({
            message: "Failed to fetch registrations",
            error: error.message
        });
    }
};

const getAllRegistrations = async (req, res) => {
    try {
        const [registrations] = await pool.execute(
            `SELECT g.transaction_id, g.participant_name, u.email, g.institution, p.title AS paper,
                    tt.label AS ticket, g.amount_paid, g.promo_code, g.registered_on, g.checked_in
             FROM registrations g
             JOIN users u ON u.user_id = g.user_id
             JOIN papers p ON p.paper_id = g.paper_id
             JOIN ticket_types tt ON tt.ticket_type_id = g.ticket_type_id
             ORDER BY g.registered_on DESC`
        );

        return res.json(registrations);

    } catch (error) {
        console.error("Get all registrations error:", error);
        return res.status(500).json({
            message: "Failed to fetch all registrations",
            error: error.message
        });
    }
};

const toggleCheckIn = async (req, res) => {
    try {
        const { transaction_id } = req.params;

        const [result] = await pool.execute(
            `UPDATE registrations 
             SET checked_in = NOT checked_in 
             WHERE transaction_id = ?
             RETURNING transaction_id, checked_in`,
            [transaction_id]
        );

        if (!result || result.length === 0) {
            return res.status(404).json({ message: "Registration not found" });
        }

        return res.json({
            message: `Check-in status updated to ${result[0].checked_in}`,
            registration: result[0]
        });

    } catch (error) {
        console.error("Toggle check-in error:", error);
        return res.status(500).json({
            message: "Failed to update check-in status",
            error: error.message
        });
    }
};

module.exports = {
    registerForConference,
    getMyRegistrations,
    getAllRegistrations,
    toggleCheckIn
};
