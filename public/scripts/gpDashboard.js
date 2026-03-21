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

    container.innerHTML = patients.map(p => `
        <div class="patient-card">
            <p><strong>${p.firstname} ${p.surname}</strong></p>
            <p>${p.email}</p>
            <p>DOB: ${new Date(p.dob).toLocaleDateString('en-GB')}</p>
        </div>
    `).join('');
}

loadPatients();