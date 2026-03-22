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
  res.redirect('/login');
}

// protected pages before static
app.get('/dashboard', requireAuth, (req, res) => { res.sendFile(path.join(__dirname, '../public/pages/dashboard.html')); });
app.get('/account', requireAuth, (req, res) => { res.sendFile(path.join(__dirname, '../public/pages/account.html')); });
app.get('/browseData', requireAuth, (req, res) => { res.sendFile(path.join(__dirname, '../public/pages/browseData.html')); });

// serve frontend files
app.use(express.static(path.join(__dirname, "../public")));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/index.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/register.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/login.html'));
});

app.use((req, res, next) => { req.db = connection; next(); });
const gpRoutes = require('./routes/gp');
app.use('/', gpRoutes);

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
        res.redirect('/dashboard');
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
    res.redirect('/dashboard');
  });
});

// delete account
app.post('/delete-account', requireAuth, (req, res) => {

  const userId = req.session.user.userID;
  const sql = "DELETE FROM users WHERE userID = ?";

  connection.query(sql, [userId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Failed to delete account");
    }

    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/register');
    });
  });

});

// logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

app.get('/api/account', requireAuth, (req, res) => { res.json(req.session.user); });

// usrrecrord stuff
app.post('/api/user-record', requireAuth, (req,res) => {
  var userID = req.session.user.userID;
  var field = req.body.field;
  var value = req.body.value;
  var date = req.body.date;

  var allowedFields = ['calories','steps','fluidIntake','weight','restHR','activeHR'];
  if(allowedFields.indexOf(field) === -1) return res.status(400).json({error: 'Invalid field'});
  if(value === undefined || isNaN(value)) return res.status(400).json({error: 'Invalid value'});
  if(!date) return res.status(400).json({error: 'Date required'});

  var sql = 'INSERT INTO userRecords (userID, date, '+field+') VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE '+field+' = ?';

  connection.query(sql, [userID, date, value, value], (err) => {
    if(err){
      console.error(err);
      return res.status(500).json({error: 'Failed to save'});
    }
    res.json({success: true});
  });
});

app.post('/api/user-record-bp', requireAuth, (req,res) => {
  var userID = req.session.user.userID;
  var sys = req.body.systolic;
  var dia = req.body.diastolic;
  var date = req.body.date;

  if(!sys || !dia || !date) return res.status(400).json({error: 'All fields required'});

  var sql = 'INSERT INTO userRecords (userID, date, systolicPressure, diastolicPressure) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE systolicPressure = ?, diastolicPressure = ?';

  connection.query(sql, [userID, date, sys, dia, sys, dia], (err) => {
    if(err){
      console.error(err);
      return res.status(500).json({error: 'Failed to save'})
    }
    res.json({success: true});
  });
});

app.get('/api/user-records', requireAuth, (req,res) => {
  var userID = req.session.user.userID;
  var from = req.query.from;
  var to = req.query.to;

  var sql = 'SELECT date, calories, steps, fluidIntake, weight, restHR, activeHR, systolicPressure, diastolicPressure FROM userRecords WHERE userID = ?';
  var params = [userID];

  if(from){ sql += ' AND date >= ?'; params.push(from); }
  if(to){ sql += ' AND date <= ?'; params.push(to); }
  sql += ' ORDER BY date ASC';

  connection.query(sql, params, (err, results) => {
    if(err){
      console.error(err);
      return res.status(500).json({error: 'Failed to fetch records'});
    }
    var out = [];
    for(var i = 0; i < results.length; i++){
      var r = results[i];
      out.push({
        date: r.date.toISOString().split('T')[0],
        calories: r.calories, steps: r.steps, fluidIntake: r.fluidIntake,
        weight: r.weight, restHR: r.restHR, activeHR: r.activeHR,
        systolicPressure: r.systolicPressure, diastolicPressure: r.diastolicPressure
      });
    }
    res.json(out);
  });
});

// find users to add as friends
app.get('/api/users/search', requireAuth, (req, res) => {
  const q = (req.query.q || '').trim();
  const currentUserId = req.session.user.userID;

  if (!q) return res.json([]);

  const sql = `
    SELECT userID, username, firstname, surname, email
    FROM users
    WHERE userID != ?
      AND (
        username LIKE ?
        OR email LIKE ?
        OR firstname LIKE ?
        OR surname LIKE ?
      )
    LIMIT 10
  `;

  const like = `%${q}%`;

  connection.query(sql, [currentUserId, like, like, like, like], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to search users' });
    }
    res.json(results);
  });
});

// send friend request
app.post('/api/friends/request', requireAuth, (req, res) => {
  const currentUserId = req.session.user.userID;
  const targetUserId = parseInt(req.body.targetUserId, 10);

  if (!targetUserId) {
    return res.status(400).json({ error: 'targetUserId required' });
  }

  if (currentUserId === targetUserId) {
    return res.status(400).json({ error: 'You cannot add yourself' });
  }
  const checkSql = `
    SELECT *
    FROM userrelationships
    WHERE (user1 = ? AND user2 = ?)
       OR (user1 = ? AND user2 = ?)
  `;

  connection.query(checkSql, [currentUserId, targetUserId, targetUserId, currentUserId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to check relationship' });
    }

    if (rows.length > 0) {
      return res.status(409).json({ error: 'Friend request or friendship already exists' });
    }

    const insertSql = `
      INSERT INTO userrelationships (user1, user2, accepted)
      VALUES (?, ?, 0)
    `;

    connection.query(insertSql, [currentUserId, targetUserId], (insertErr) => {
      if (insertErr) {
        console.error(insertErr);
        return res.status(500).json({ error: 'Failed to send request' });
      }

      res.json({ success: true });
    });
  });
});

// get pending friend requests sent to current user
app.get('/api/friends/requests', requireAuth, (req, res) => {
  const currentUserId = req.session.user.userID;

  const sql = `
    SELECT ur.user1 AS userID, u.username, u.firstname, u.surname, u.email
    FROM userrelationships ur
    JOIN users u ON u.userID = ur.user1
    WHERE ur.user2 = ?
      AND ur.accepted = 0
  `;

  connection.query(sql, [currentUserId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch requests' });
    }

    res.json(results);
  });
});

// accept friend request
app.post('/api/friends/accept', requireAuth, (req, res) => {
  const currentUserId = req.session.user.userID;
  const requesterUserId = parseInt(req.body.requesterUserId, 10);

  if (!requesterUserId) {
    return res.status(400).json({ error: 'requesterUserId required' });
  }

  const sql = `
    UPDATE userrelationships
    SET accepted = 1
    WHERE user1 = ? AND user2 = ? AND accepted = 0
  `;

  connection.query(sql, [requesterUserId, currentUserId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to accept request' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No pending request found' });
    }

    res.json({ success: true });
  });
});

// get accepted friends
app.get('/api/friends', requireAuth, (req, res) => {
  const currentUserId = req.session.user.userID;

  const sql = `
    SELECT u.userID, u.username, u.firstname, u.surname, u.email
    FROM userrelationships ur
    JOIN users u
      ON (
        (ur.user1 = ? AND ur.user2 = u.userID)
        OR
        (ur.user2 = ? AND ur.user1 = u.userID)
      )
    WHERE ur.accepted = 1
  `;

  connection.query(sql, [currentUserId, currentUserId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch friends' });
    }

    res.json(results);
  });
});

app.listen(8081, () => {
  console.log("Server running at http://127.0.0.1:8081/");
});
