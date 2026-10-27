const express = require("express");

const {
    registerForConference,
    getMyRegistrations,
    getAllRegistrations,
    toggleCheckIn
} = require("../controllers/registrationController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

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

router.get(
    "/all",
    authenticateToken,
    authorizeRoles("Organizer"),
    getAllRegistrations
);

router.patch(
    "/:transaction_id/check-in",
    authenticateToken,
    authorizeRoles("Organizer"),
    toggleCheckIn
);

module.exports = router;
