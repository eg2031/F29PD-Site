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
