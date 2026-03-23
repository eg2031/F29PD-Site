async function loadPatient() {
    const params = new URLSearchParams(window.location.search);
    const userID = params.get('userID');

    if (!userID) {
        document.getElementById('patientName').textContent = 'No patient selected';
        return;
    }

    const res = await fetch(`/api/patient/${userID}`);
    if (!res.ok) {
        document.getElementById('patientName').textContent = 'Failed to load patient';
        return;
    }

    const records = await res.json();
    const p = records[0];

    // Patient info
    document.getElementById('patientName').textContent = `${p.firstname} ${p.surname}`;
    document.getElementById('patientInfo').innerHTML = `
        <p><strong>Email:</strong> ${p.email}</p>
        <p><strong>DOB:</strong> ${new Date(p.dob).toLocaleDateString('en-GB')}</p>
        <p><strong>Step Goal:</strong> ${p.stepgoal ?? 'Not set'}</p>
    `;

    // Health records table
    const hasRecords = records.some(r => r.date !== null);
    if (!hasRecords) {
        document.getElementById('healthRecords').innerHTML = '<p>No health records found.</p>';
        return;
    }

    document.getElementById('healthRecords').innerHTML = `
        <table class="patient-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Steps</th>
                    <th>Calories</th>
                    <th>Fluid (ml)</th>
                    <th>Weight (kg)</th>
                    <th>Resting HR</th>
                    <th>Active HR</th>
                    <th>Systolic</th>
                    <th>Diastolic</th>
                </tr>
            </thead>
            <tbody>
                ${records.map(r => `
                    <tr>
                        <td>${new Date(r.date).toLocaleDateString('en-GB')}</td>
                        <td>${r.steps ?? '-'}</td>
                        <td>${r.calories ?? '-'}</td>
                        <td>${r.fluidIntake ?? '-'}</td>
                        <td>${r.weight ?? '-'}</td>
                        <td>${r.restHR ?? '-'}</td>
                        <td>${r.activeHR ?? '-'}</td>
                        <td>${r.systolicPressure ?? '-'}</td>
                        <td>${r.diastolicPressure ?? '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

loadPatient();