const express = require("express");

const {
    registerForConference,
    getMyRegistrations
} = require("../controllers/registrationController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/register",
    authenticateToken,
    registerForConference
);

router.get(
    "/my-registrations",
    authenticateToken,
    getMyRegistrations
);

module.exports = router;