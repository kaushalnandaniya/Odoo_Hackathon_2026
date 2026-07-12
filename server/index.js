const express = require('express');
const cors = require('cors');
const BloomFilter = require('./bloomFilter');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Bloom Filter
const userBloomFilter = new BloomFilter();

// Mock database (In a real app, this would be Postgres/Odoo)
const usersDB = [];

// Seed the bloom filter and mock DB
const mockUser = { name: "Raven", email: "raven.k@transitops.in", password: "password123", role: "dispatcher" };
usersDB.push(mockUser);
userBloomFilter.addUser(mockUser.email);

console.log(`Bloom Filter seeded with mock user: ${mockUser.email}`);

// Route: Check if email exists (Bloom Filter fast-path)
app.post('/api/auth/check-email', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const exists = userBloomFilter.checkUserExists(email);
    res.json({ exists });
});

// Route: Register new user
app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role } = req.body;

    // 1. Fast-path check using Bloom Filter
    if (userBloomFilter.checkUserExists(email)) {
        // Technically it could be a false positive, so in a real app we'd also check the DB here just to be sure.
        // But if it returns true, we treat it as "likely exists" for the frontend warning.
        const actualUser = usersDB.find(u => u.email === email);
        if (actualUser) {
            return res.status(400).json({ error: "User already exists" });
        }
    }

    // Register user
    const newUser = { name, email, password, role };
    usersDB.push(newUser);
    userBloomFilter.addUser(email); // Add to filter

    res.status(201).json({ message: "User registered successfully", user: { name, email, role } });
});

// Route: Login
app.post('/api/auth/login', (req, res) => {
    const { email, password, role } = req.body;

    const user = usersDB.find(u => u.email === email);
    if (!user || user.password !== password || user.role !== role) {
        return res.status(401).json({ error: "Invalid credentials or role mismatch" });
    }

    res.json({ message: "Login successful", token: "mock_jwt_token_here", user: { name: user.name, email: user.email, role: user.role } });
});

app.listen(PORT, () => {
    console.log(`TransitOps Backend running on http://localhost:${PORT}`);
});
