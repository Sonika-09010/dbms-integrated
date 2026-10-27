const express = require("express");

const {
    addCoAuthor,
    getPaperAuthors
} = require("../controllers/authorController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/add",
    authenticateToken,
    authorizeRoles("Author"),
    addCoAuthor
);

router.get(
    "/paper/:paper_id",
    authenticateToken,
    getPaperAuthors
);

module.exports = router;