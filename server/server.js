require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();

app.use(express.urlencoded({ extended: true }));

// serve frontend files
app.use(express.static(path.join(__dirname, "../public")));

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

app.post('/register', (req, res) => {
  const { firstName, familyName, username, dob, email, password } = req.body;

  const sql = `
    INSERT INTO users (firstname, surname, username, dob, email, password)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    sql,
    [firstName, familyName, username, dob, email, password],
    (err, result) => {
      if (err) {
        console.error(err);
        res.send("Registration failed: " + err.sqlMessage);
        return;
      }

      res.send("User registered successfully!");
    }
  );
});

app.listen(8081, () => {
  console.log("Server running at http://127.0.0.1:8081/");
});