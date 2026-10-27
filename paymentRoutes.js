const express = require("express");

const {
    createPayment,
    getPaymentStatus
} = require("../controllers/paymentController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/pay",
    authenticateToken,
    createPayment
);

router.get(
    "/status/:registration_id",
    authenticateToken,
    getPaymentStatus
);

module.exports = router;