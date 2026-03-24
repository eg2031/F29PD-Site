async function loadPatients() {
    const res = await fetch('/api/patients');

    if (!res.ok) {
        document.getElementById('patientList').innerHTML = '<p>Failed to load patients.</p>';
        return;
    }

    const patients = await res.json();
    const container = document.getElementById('patientList');

    if (patients.length === 0) {
        container.innerHTML = '<p>No patients assigned to you yet.</p>';
        return;
    }

    container.innerHTML = `
    <table class="patient-table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>DOB</th>
            </tr>
        </thead>
        <tbody>
${patients.map(p => `
    <tr class="patient-row" onclick="window.location.href='/gpPatient?userID=${p.userID}'">
        <td>${p.firstname} ${p.surname}</td>
        <td>${p.email}</td>
        <td>${new Date(p.dob).toLocaleDateString('en-GB')}</td>
    </tr>
`).join('')}
        </tbody>
    </table>
`;
}

/* load pending join requests, and allow GP to accept or deny request */
async function loadPending() {
    const res = await fetch('/api/gp/pending');
    if (!res.ok) {
        document.getElementById('pendingList').innerHTML = '<p>Failed to load requests.</p>';
        return;
    }

    const requests = await res.json();
    const container = document.getElementById('pendingList');

    if (requests.length === 0) {
        container.innerHTML = '<p>No pending requests.</p>';
        return;
    }

    container.innerHTML = `
        <table class="patient-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${requests.map(r => `
                    <tr>
                        <td>${r.firstname} ${r.surname}</td>
                        <td>${r.email}</td>
                        <td>
                            <button onclick="acceptPatient(${r.userID})">Accept</button>
                            <button onclick="rejectPatient(${r.userID})">Reject</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function acceptPatient(userID) {
    const res = await fetch('/api/gp/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID })
    });

    if (res.ok) {
        loadPatients();
        loadPending();
    } else {
        alert('Failed to accept patient.');
    }
}

async function rejectPatient(userID) {
    const res = await fetch('/api/gp/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID })
    });

    if (res.ok) {
        loadPending();
    } else {
        alert('Failed to reject patient.');
    }
}

loadPending();
loadPatients();