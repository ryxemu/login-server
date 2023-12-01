// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database(':memory:'); // In-memory database for simplicity

// Create users table
db.serialize(() => {
    db.run('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, salt TEXT)');
});

// User registration endpoint
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const saltRounds = 12; // Increase rounds for stronger hashing
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    db.run('INSERT INTO users (username, password, salt) VALUES (?, ?, ?)', [username, hashedPassword, salt], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error registering user' });
        }
        res.json({ message: 'Registration successful' });
    });
});

// User login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            res.status(500).json({ message: 'Internal server error' });
        } else if (!row) {
            res.status(401).json({ message: 'Invalid credentials' });
        } else {
            const passwordHash = row.password;
            const salt = row.salt;

            if (bcrypt.compareSync(password, passwordHash)) {
                res.json({ message: 'Login successful' });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});