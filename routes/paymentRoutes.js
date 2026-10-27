const express = require("express");

const {
    calculatePrice,
    createPayment,
    getPaymentStatus
} = require("../controllers/paymentController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/price", calculatePrice);
router.post("/process", authenticateToken, createPayment);
router.get("/:transaction_id", authenticateToken, getPaymentStatus);

module.exports = router;
