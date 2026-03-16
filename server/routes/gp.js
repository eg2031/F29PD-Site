const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const path = require('path');

router.get('/gpLogin', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/gpLogin.html'));
});

router.post('/gpLogin', async (req, res) => {
    const { email, password } = req.body;
    console.log('GP Login Attempt:', email, password)
    if (!email || !password) return res.send("Email and password are required");

    const sql = `SELECT * FROM gpusers WHERE email = ?`;
    req.db.query(sql, [email], async (err, results) => {
        if (err) return res.send("Login failed: " + err.sqlMessage);
        if (results.length === 0) return res.send("No GP found with that email");

        const gp = results[0];

        // password check
        if (password !== gp.password) return res.send("Incorrect password");
        else {

            req.session.user = {gpID: gp.gpID, username: gp.username, email: gp.email, isGP: true};
            return res.send("Login confirmed")
        }
        //res.redirect('/dashboard');
    });
});

module.exports = router;