require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'scoopdiddypoop',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true, sameSite: 'lax' }
}));

function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  if (req.headers.accept && req.headers.accept.includes('application/json')) return res.status(401).json({ error: 'Not authenticated' });
  res.redirect('/pages/login.html');
}

// serve frontend files
app.use(express.static(path.join(__dirname, "../public")));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/index.html'));
});

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

app.get('/auth/me', (req, res) => {
  if (req.session && req.session.user) return res.json({ loggedIn: true, user: req.session.user });
  res.json({ loggedIn: false });
});

app.post('/register', async (req, res) => {
  const { firstName, familyName, username, dob, email, password } = req.body;
  if (!firstName || !familyName || !username || !dob || !email || !password) return res.status(400).send("All fields are required");

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO users (firstname, surname, username, dob, email, password)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    connection.query(
      sql,
      [firstName, familyName, username, dob, email, hashedPassword],
      (err, result) => {
        if (err) {
          console.error(err);
          if (err.code === 'ER_DUP_ENTRY') return res.status(409).send("Username or email already exists");
          res.send("Registration failed: " + err.sqlMessage);
          return;
        }
        req.session.user = { userID: result.insertId, username, firstname: firstName, surname: familyName, email };
        res.redirect('/pages/dashboard.html');
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error during registration");
  }
});

// login 
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.send("Email and password are required");
  }

  const sql = `SELECT * FROM users WHERE email = ?`;
  connection.query(sql, [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.send("Login failed: " + err.sqlMessage);
    }

    if (results.length === 0) {
      return res.send("No user found with that email");
    }

    const user = results[0];

    // password check
    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.send("Incorrect password");
    } catch {
      if (password !== user.password) return res.send("Incorrect password");
    }

    req.session.user = { userID: user.userID, username: user.username, firstname: user.firstname, surname: user.surname, email: user.email };
    // Login successful then redirect to dashboard
    res.redirect('/pages/dashboard.html');
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.redirect('/pages/login.html');
  });
});

app.get('/pages/dashboard.html', requireAuth, (req, res) => { res.sendFile(path.join(__dirname, '../public/pages/dashboard.html')); });
app.get('/pages/account.html', requireAuth, (req, res) => { res.sendFile(path.join(__dirname, '../public/pages/account.html')); });
app.get('/pages/browseData.html', requireAuth, (req, res) => { res.sendFile(path.join(__dirname, '../public/pages/browseData.html')); });

app.get('/api/account', requireAuth, (req, res) => { res.json(req.session.user); });

app.listen(8081, () => {
  console.log("Server running at http://127.0.0.1:8081/");
});
