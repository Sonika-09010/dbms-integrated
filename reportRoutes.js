const express = require("express");

const {
    getDashboard,
    getPaperReport,
    getRegistrationReport
} = require("../controllers/reportController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/dashboard",
    authenticateToken,
    getDashboard
);

router.get(
    "/papers",
    authenticateToken,
    getPaperReport
);

router.get(
    "/registrations",
    authenticateToken,
    getRegistrationReport
);

module.exports = router;