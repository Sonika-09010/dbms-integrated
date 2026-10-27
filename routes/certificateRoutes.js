const express = require("express");

const {
    generateCertificate,
    getMyCertificates
} = require("../controllers/certificateController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/generate",
    authenticateToken,
    generateCertificate
);

router.get(
    "/my-certificates",
    authenticateToken,
    getMyCertificates
);

module.exports = router;