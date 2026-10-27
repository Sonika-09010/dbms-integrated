const express = require("express");

const {
    getTracks,
    getImportantDates,
    getSessions,
    assignSession,
    getAnnouncements,
    createAnnouncement
} = require("../controllers/conferenceController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/tracks", getTracks);
router.get("/dates", getImportantDates);
router.get("/sessions", getSessions);
router.get("/announcements", getAnnouncements);

router.post(
    "/sessions",
    authenticateToken,
    authorizeRoles("Organizer"),
    assignSession
);

router.post(
    "/announcements",
    authenticateToken,
    authorizeRoles("Organizer"),
    createAnnouncement
);

module.exports = router;
