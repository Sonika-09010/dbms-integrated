const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const allowedRoles = [
    "Author",
    "Reviewer",
    "Participant",
    "Organizer"
];

const register = async (req, res) => {
    try {
        const {
            name,
            full_name,
            email,
            password,
            role
        } = req.body;

        const userName = (name || full_name || "").trim();

        if (!userName || !email || !password || !role) {
            return res.status(400).json({
                message: "Full name, email, password, and role are required"
            });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role. Must be Author, Reviewer, Participant, or Organizer"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        const [existingUser] = await pool.execute(
            "SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)",
            [email.trim()]
        );

        if (existingUser && existingUser.length > 0) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.execute(
            `INSERT INTO users (full_name, email, password_hash, role)
             VALUES (?, ?, ?, ?)
             RETURNING user_id, full_name, email, role`,
            [
                userName,
                email.trim().toLowerCase(),
                hashedPassword,
                role
            ]
        );

        const createdUser = result[0];

        return res.status(201).json({
            message: "User registered successfully",
            user_id: createdUser ? createdUser.user_id : null,
            user: createdUser
        });

    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const [users] = await pool.execute(
            "SELECT user_id, full_name, email, password_hash, role FROM users WHERE LOWER(email) = LOWER(?)",
            [email.trim()]
        );

        if (!users || users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || "super_secret_test_key",
            {
                expiresIn: "7d"
            }
        );

        return res.json({
            message: "Login successful",
            token,
            user: {
                user_id: user.user_id,
                name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
};

module.exports = {
    register,
    login
};
