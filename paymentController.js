const createPayment = async (req, res) => {
    try {
        const {
            registration_id,
            amount,
            payment_method
        } = req.body;

        if (!registration_id || amount === undefined || !payment_method) {
            return res.status(400).json({
                message:
                    "Registration ID, amount and payment method are required"
            });
        }

        if (Number(amount) <= 0) {
            return res.status(400).json({
                message: "Payment amount must be greater than zero"
            });
        }

        res.status(201).json({
            message: "Payment request received",
            payment: {
                registration_id,
                amount: Number(amount),
                payment_method,
                status: "Pending"
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Payment processing failed"
        });
    }
};

const getPaymentStatus = async (req, res) => {
    try {
        const { registration_id } = req.params;

        if (!registration_id) {
            return res.status(400).json({
                message: "Registration ID is required"
            });
        }

        res.json({
            message: "Payment status endpoint",
            registration_id,
            status: "Pending"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch payment status"
        });
    }
};

module.exports = {
    createPayment,
    getPaymentStatus
};