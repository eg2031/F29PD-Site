const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const path = require('path');

router.get('/gpLogin', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/gpLogin.html'));
});
router.get('/gpDashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/gpDashboard.html'));
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
        if (password === gp.password) {
            req.session.user = {gpID: gp.gpID, username: gp.username, email: gp.email, isGP: true};
            res.redirect('/gpDashboard')
        }

        else {
            return res.send("Incorrect password");

        }
    });
});

router.get('/api/patients', (req, res) => {
    if (!req.session.user || !req.session.user.isGP) {
        return res.status(401).json({ error: 'Unauthorised' });
    }

    const gpID = req.session.user.gpID;

    const sql = `
        SELECT u.userID, u.username, u.firstname, u.surname, u.email, u.dob, i.accepted
        FROM users u
                 JOIN isgp i ON u.userID = i.userID
        WHERE i.gpID = ? AND i.accepted = 1
    `;

    req.db.query(sql, [gpID], (err, results) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        res.json(results);
    });
});

router.get('/gpPatient', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/pages/gpPatient.html'));
});

router.get('/api/patient/:userID', (req, res) => {
    if (!req.session.user || !req.session.user.isGP) {
        return res.status(401).json({ error: 'Unauthorised' });
    }

    const { userID } = req.params;
    const gpID = req.session.user.gpID;

    // Make sure this patient actually belongs to this GP
    const sql = `
        SELECT u.firstname, u.surname, u.email, u.dob, u.stepgoal,
               r.date, r.calories, r.steps, r.fluidIntake, r.weight,
               r.restHR, r.activeHR, r.systolicPressure, r.diastolicPressure
        FROM users u
        JOIN isgp i ON u.userID = i.userID
        LEFT JOIN userRecords r ON u.userID = r.userID
        WHERE u.userID = ? AND i.gpID = ? AND i.accepted = 1
        ORDER BY r.date DESC
    `;

    req.db.query(sql, [userID, gpID], (err, results) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        if (results.length === 0) return res.status(404).json({ error: 'Patient not found' });
        res.json(results);
    });
});

module.exports = router;