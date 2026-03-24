document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch('/auth/me');
    const data = await res.json();
    updateNav(data.loggedIn, data.user);
  } catch (err) {
    console.error(err);
  }
});

/* Create nav bar, nav bar is different for users and GP users */
function updateNav(loggedIn, user) {
  const navLeft = document.querySelector('.nav-left');
  if (!navLeft) return;

  if (loggedIn && user.isGP) {
    navLeft.innerHTML = `
      <form action="/logout" method="POST" style="display:inline;margin:0;padding:0;">
        <button type="submit" class="nav-logout-btn">Logout</button>
      </form>
    `;
  } else if (loggedIn) {
    navLeft.innerHTML = `
      <a href="dashboard">Dashboard</a>
      <a href="browseData">My Data</a>
      <form action="/logout" method="POST" style="display:inline;margin:0;padding:0;">
        <button type="submit" class="nav-logout-btn">Logout</button>
      </form>
    `;
  } else {
    navLeft.innerHTML = `
      <a href="register">Register</a>
      <a href="login">Login</a>
    `;
  }
}
