const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// A fake secret for testing
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_test_key';

// Mock route for testing without a database
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Accept any password, just generate a token
    const token = jwt.sign({ id: 1, email: email, role: 'Author' }, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({
        success: true,
        token: token,
        user: { id: 1, name: "Test User", email: email, role: 'Author' }
    });
});

router.post('/register', (req, res) => {
    res.json({ success: true, message: "Mock registration successful" });
});

module.exports = router;