document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch('/api/account');
    if (!res.ok) { window.location.href = '/login'; return; }
    const user = await res.json();

    const container = document.querySelector('.container ul');
    if (container) {
      container.innerHTML = `
        <li><div><h2>User ID:</h2><p>${user.userID}</p></div></li>
        <li><div><h2>Username:</h2><p>${user.username}</p></div></li>
        <li><div><h2>First Name:</h2><p>${user.firstname}</p></div></li>
        <li><div><h2>Family Name:</h2><p>${user.surname}</p></div></li>
        <li><div><h2>Email:</h2><p>${user.email}</p></div></li>
      `;
    }
  } catch (err) {
    console.error(err);
  }
});


/* Code to join GP Practice */
async function searchGP() {
  const query = document.getElementById('gpSearch').value.trim();
  if (!query) return;

  const res = await fetch(`/api/gp/search?centre=${encodeURIComponent(query)}`);
  const results = await res.json();
  const container = document.getElementById('gpResults');

  if (results.length === 0) {
    container.innerHTML = '<p>No practices found.</p>';
    return;
  }

  container.innerHTML = results.map(gp => `
        <div class="gp-result">
            <span><strong>${gp.centre}</strong> — Dr. ${gp.firstname} ${gp.surname}</span>
            <button onclick="joinGP(${gp.gpID})">Request to Join</button>
        </div>
    `).join('');
}

async function joinGP(gpID) {
  const res = await fetch('/api/gp/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gpID })
  });

  const data = await res.json();
  if (res.ok) {
    alert('Request sent! Waiting for GP approval.');
  } else {
    alert(data.error);
  }
}