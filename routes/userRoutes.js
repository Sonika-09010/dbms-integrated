const express = require("express");

const {
    getProfile,
    updateProfile,
    changePassword,
    getAllUsers
} = require("../controllers/userController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, updateProfile);
router.put("/change-password", authenticateToken, changePassword);
router.get("/all", authenticateToken, authorizeRoles("Organizer"), getAllUsers);

module.exports = router;
