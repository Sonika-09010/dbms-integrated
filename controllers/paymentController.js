const pool = require("../config/db");

const calculatePrice = async (req, res) => {
    try {
        const { paper_id, ticket_code = "academic", promo_code } = req.query;

        if (!paper_id) {
            return res.status(400).json({ message: "paper_id is required" });
        }

        const [rows] = await pool.execute(
            `SELECT ROUND(p.conference_fee * tt.factor, 2) AS base_price,
                    ROUND(p.conference_fee * tt.factor * (1.0 - COALESCE(pc.percent_off, 0) / 100.0), 2) AS total,
                    COALESCE(pc.percent_off, 0) AS percent_off
             FROM papers p
             JOIN ticket_types tt ON LOWER(tt.code) = LOWER(?)
             LEFT JOIN promo_codes pc ON UPPER(pc.code) = UPPER(?) AND pc.valid_until >= CURRENT_DATE
             WHERE p.paper_id = ?`,
            [ticket_code, promo_code || "", paper_id]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "Paper or ticket type not found" });
        }

        return res.json({
            base_price: Number(rows[0].base_price),
            total: Number(rows[0].total),
            discount_percent: Number(rows[0].percent_off)
        });

    } catch (error) {
        console.error("Calculate price error:", error);
        return res.status(500).json({ message: "Price calculation failed", error: error.message });
    }
};

const createPayment = async (req, res) => {
    try {
        const { transaction_id, amount } = req.body;

        if (!transaction_id) {
            return res.status(400).json({ message: "transaction_id is required" });
        }

        const [reg] = await pool.execute(
            "SELECT transaction_id, amount_paid FROM registrations WHERE transaction_id = ?",
            [transaction_id]
        );

        if (!reg || reg.length === 0) {
            return res.status(404).json({ message: "Registration not found" });
        }

        return res.json({
            message: "Payment processed successfully",
            payment: {
                transaction_id,
                amount: amount || reg[0].amount_paid,
                status: "Completed"
            }
        });

    } catch (error) {
        console.error("Create payment error:", error);
        return res.status(500).json({ message: "Payment processing failed", error: error.message });
    }
};

const getPaymentStatus = async (req, res) => {
    try {
        const { transaction_id } = req.params;

        const [reg] = await pool.execute(
            "SELECT transaction_id, amount_paid, registered_on, checked_in FROM registrations WHERE transaction_id = ?",
            [transaction_id]
        );

        if (!reg || reg.length === 0) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        return res.json({
            transaction_id: reg[0].transaction_id,
            amount: reg[0].amount_paid,
            status: "Completed",
            registered_on: reg[0].registered_on,
            checked_in: reg[0].checked_in
        });

    } catch (error) {
        console.error("Payment status error:", error);
        return res.status(500).json({ message: "Failed to fetch payment status", error: error.message });
    }
};

module.exports = {
    calculatePrice,
    createPayment,
    getPaymentStatus
};
