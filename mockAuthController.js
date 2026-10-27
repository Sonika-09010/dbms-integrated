/**
 * mockAuthController.js
 *
 * DROP-IN REPLACEMENT for authController.js during local development.
 * Zero database dependency — uses an in-memory array so you can login
 * and register without MySQL running.
 *
 * HOW TO RESTORE THE REAL CONTROLLER:
 *   In authRoutes.js change:
 *     require("../controllers/mockAuthController")
 *   back to:
 *     require("../controllers/authController")
 *
 * ⚠️  THIS FILE IS FOR LOCAL DEV ONLY. Never ship it to production.
 */

const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");

// ─── In-memory user store ────────────────────────────────────────────────────
// Pre-seeded with one account per role so you can test every dashboard
// immediately. Passwords are bcrypt-hashed at startup (sync, once only).
const MOCK_USERS = [
    {
        user_id:  1,
        name:     "Dr. Alex Morgan",
        email:    "alex@university.edu",
        password: bcrypt.hashSync("password123", 10),
        role:     "Author",
        phone:    null
    },
    {
        user_id:  2,
        name:     "Prof. Sarah Jenkins",
        email:    "sarah@reviewer.org",
        password: bcrypt.hashSync("password123", 10),
        role:     "Reviewer",
        phone:    null
    },
    {
        user_id:  3,
        name:     "Sam Wilson",
        email:    "sam@gmail.com",
        password: bcrypt.hashSync("password123", 10),
        role:     "Participant",
        phone:    null
    },
    {
        user_id:  4,
        name:     "Admin Chair",
        email:    "admin@event.org",
        password: bcrypt.hashSync("password123", 10),
        role:     "Organizer",
        phone:    null
    },
    // Quick test account — the one mentioned in the task.
    {
        user_id:  5,
        name:     "Test User",
        email:    "test@test.com",
        password: bcrypt.hashSync("password123", 10),
        role:     "Author",
        phone:    null
    }
];

// Running counter for auto-incremented IDs of newly registered users.
let nextId = MOCK_USERS.length + 1;

const ALLOWED_ROLES = ["Author", "Reviewer", "Participant", "Organizer"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const findByEmail = (email) =>
    MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());

const jwtSecret = () =>
    process.env.JWT_SECRET || "mock_dev_secret_change_in_production";

const signToken = (user) =>
    jwt.sign(
        { user_id: user.user_id, role: user.role },
        jwtSecret(),
        { expiresIn: "1d" }
    );

const safeUser = (u) => ({
    user_id: u.user_id,
    name:    u.name,
    email:   u.email,
    role:    u.role,
    phone:   u.phone
});

// ─── register ────────────────────────────────────────────────────────────────
const register = async (req, res) => {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "Name, email, password and role are required" });
    }
    if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ message: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(", ")}` });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (findByEmail(email)) {
        return res.status(409).json({ message: "Email already registered" });
    }

    const newUser = {
        user_id:  nextId++,
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role,
        phone:    phone || null
    };
    MOCK_USERS.push(newUser);

    console.log(`[MOCK AUTH] Registered: ${email} (${role})  — store now has ${MOCK_USERS.length} users`);

    return res.status(201).json({
        message: "User registered successfully (mock — not persisted to DB)",
        user_id: newUser.user_id
    });
};

// ─── login ───────────────────────────────────────────────────────────────────
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const user = findByEmail(email);
    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user);
    console.log(`[MOCK AUTH] Login OK: ${email} (${user.role})`);

    return res.json({
        message: "Login successful (mock)",
        token,
        user: safeUser(user)
    });
};

module.exports = { register, login };
