const express = require("express");

const {
    createSession,
    getSessions,
    addKeynoteSpeaker
} = require("../controllers/conferenceController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/sessions",
    authenticateToken,
    createSession
);

router.get(
    "/:conference_id/sessions",
    authenticateToken,
    getSessions
);

router.post(
    "/keynote-speakers",
    authenticateToken,
    addKeynoteSpeaker
);

module.exports = router;