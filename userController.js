const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const getProfile = async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT user_id, name, email, role, phone
             FROM Users
             WHERE user_id = ?`,
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json(users[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch profile"
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (!name && !phone) {
            return res.status(400).json({
                message: "Provide name or phone to update"
            });
        }

        const [result] = await pool.execute(
            `UPDATE Users
             SET name = COALESCE(?, name),
                 phone = COALESCE(?, phone)
             WHERE user_id = ?`,
            [name || null, phone || null, req.user.user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            message: "Profile updated successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update profile"
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
            "SELECT password FROM Users WHERE user_id = ?",
            [req.user.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const passwordMatch = await bcrypt.compare(
            currentPassword,
            users[0].password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Current password is incorrect"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.execute(
            "UPDATE Users SET password = ? WHERE user_id = ?",
            [hashedPassword, req.user.user_id]
        );

        res.json({
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to change password"
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword
};