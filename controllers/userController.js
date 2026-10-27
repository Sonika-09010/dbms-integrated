const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const getProfile = async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT user_id, full_name, email, role, created_at
             FROM users
             WHERE user_id = ?`,
            [req.user.user_id]
        );

        if (!users || users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            user_id: users[0].user_id,
            name: users[0].full_name,
            email: users[0].email,
            role: users[0].role,
            created_at: users[0].created_at
        });

    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            message: "Failed to fetch profile",
            error: error.message
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, full_name } = req.body;
        const newName = (name || full_name || "").trim();

        if (!newName) {
            return res.status(400).json({
                message: "Provide a name to update"
            });
        }

        const [result] = await pool.execute(
            `UPDATE users
             SET full_name = ?
             WHERE user_id = ?
             RETURNING user_id, full_name, email, role`,
            [newName, req.user.user_id]
        );

        if (!result || result.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            message: "Profile updated successfully",
            user: {
                user_id: result[0].user_id,
                name: result[0].full_name,
                email: result[0].email,
                role: result[0].role
            }
        });

    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            message: "Failed to update profile",
            error: error.message
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters"
            });
        }

        const [users] = await pool.execute(
            "SELECT password_hash FROM users WHERE user_id = ?",
            [req.user.user_id]
        );

        if (!users || users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const passwordMatch = await bcrypt.compare(
            currentPassword,
            users[0].password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Current password is incorrect"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.execute(
            "UPDATE users SET password_hash = ? WHERE user_id = ?",
            [hashedPassword, req.user.user_id]
        );

        res.json({
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({
            message: "Failed to change password",
            error: error.message
        });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.execute(
            "SELECT user_id, full_name, email, role, created_at FROM users ORDER BY user_id"
        );
        res.json(users);
    } catch (error) {
        console.error("Get all users error:", error);
        res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    getAllUsers
};
