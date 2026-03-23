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

loadPatients();