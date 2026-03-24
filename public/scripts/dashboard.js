document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('recordDate').valueAsDate = new Date();

  var tabs = document.querySelectorAll('.statTab');
  for(var i = 0; i < tabs.length; i++){
    tabs[i].addEventListener('click', function(){
      document.querySelectorAll('.statTab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.dataForm').forEach(f => f.classList.remove('active'));
      this.classList.add('active');
      document.getElementById(this.dataset.form).classList.add('active');
    });
  }

  setupForm('caloriesForm', 'calories', 'calories');
  setupForm('stepsForm', 'steps', 'steps');
  setupForm('fluidIntakeForm', 'fluidIntake', 'fluidIntake');
  setupForm('weightForm', 'weight', 'weight');
  setupForm('restHRForm', 'restHR', 'restHR');
  setupForm('activeHRForm', 'activeHR', 'activeHR');
  setupBPForm();

  // toast notif thing
  var t = document.createElement('div');
  t.id = 'toast';
  t.style.cssText = 'position:fixed;top:20px;right:20px;padding:15px 25px;border-radius:10px 0px;color:white;font-family:SN Pro,sans-serif;font-size:1rem;opacity:0;transition:opacity 0.3s;z-index:999;pointer-events:none;';
  document.body.appendChild(t);
});

function showToast(msg, good) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.style.backgroundColor = good ? 'rgb(50, 180, 50)' : 'rgb(220, 50, 50)';
  t.style.opacity = '1';
  setTimeout(function(){ t.style.opacity = '0' }, 2500);
}

function getDate() {
  return document.getElementById('recordDate').value;
}

function setupForm(formId, inputId, fieldName) {
  var frm = document.getElementById(formId);
  if (!frm) return;

  frm.addEventListener('submit', async function(e) {
    e.preventDefault();
    var inp = document.getElementById(inputId);
    var val = inp.value;
    if (!val) return;

    var d = getDate();
    if(!d){ showToast('Pick a date first', false); return; }

    try{
      var res = await fetch('/api/user-record', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({field: fieldName, value: parseFloat(val), date: d})
      });
      var data = await res.json();
      if(data.success){
        inp.value = '';
        showToast(fieldName + ' saved!', true);
      }else{
        showToast('Failed: ' + (data.error || 'unknown'), false);
      }
    }catch(err){
      console.error(err);
      showToast('Failed to save', false);
    }
  });
}

function setupBPForm(){
  var frm = document.getElementById('bpForm');
  if(!frm) return;

  frm.addEventListener('submit', async function(e){
    e.preventDefault();
    var sys = document.getElementById('systolic').value;
    var dia = document.getElementById('diastolic').value;
    if(!sys || !dia) return;

    var d = getDate();
    if(!d){ showToast('Pick a date first', false); return }

    try{
      var res = await fetch('/api/user-record-bp', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({systolic: parseInt(sys), diastolic: parseInt(dia), date: d})
      });
      var data = await res.json();
      if(data.success){
        document.getElementById('systolic').value = '';
        document.getElementById('diastolic').value = '';
        showToast('Blood pressure saved!', true);
      }else{
        showToast('Failed: '+(data.error || 'unknown'), false);
      }
    }catch(err){
      console.error(err)
      showToast('Failed to save', false);
    }
  });
}

async function loadLeaderboard() {
  const tbody = document.getElementById('leaderboardBody');
  if (!tbody) return;

  try {
    const res = await fetch('/api/leaderboard', { credentials: 'same-origin' });
    const data = await res.json();

    tbody.innerHTML = '';

    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="3">No leaderboard data yet.</td></tr>';
      return;
    }

    data.forEach((user, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${user.firstname} ${user.surname} (@${user.username})</td>
        <td>${user.steps || 0}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="3">Failed to load leaderboard.</td></tr>';
  }
}

async function searchUsers() {
  const input = document.getElementById('friendSearchInput');
  const resultsBox = document.getElementById('friendSearchResults');
  if (!input || !resultsBox) return;

  const q = input.value.trim();
  if (!q) {
    resultsBox.innerHTML = '<p>Enter a username or email.</p>';
    return;
  }

  try {
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, {
      credentials: 'same-origin'
    });

    const users = await res.json();
    resultsBox.innerHTML = '';

    if (!users.length) {
      resultsBox.innerHTML = '<p>No users found.</p>';
      return;
    }

    users.forEach((user) => {
      const div = document.createElement('div');
      div.className = 'friend-result';
      div.innerHTML = `
        <span>${user.firstname} ${user.surname} (@${user.username})</span>
        <button type="button" data-userid="${user.userID}">Add Friend</button>
      `;

      div.querySelector('button').addEventListener('click', async () => {
        try {
          const reqRes = await fetch('/api/friends/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ targetUserId: user.userID })
          });

          const result = await reqRes.json();

          if (!reqRes.ok) {
            alert(result.error || 'Failed to send friend request');
            return;
          }

          alert('Friend request sent');
        } catch (error) {
          console.error(error);
          alert('Failed to send friend request');
        }
      });

      resultsBox.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    resultsBox.innerHTML = '<p>Search failed.</p>';
  }
}

async function loadPendingRequests() {
  const box = document.getElementById('pendingRequests');
  if (!box) return;

  try {
    const res = await fetch('/api/friends/requests', { credentials: 'same-origin' });
    const requests = await res.json();

    box.innerHTML = '';

    if (!requests.length) {
      box.innerHTML = '<p>No pending requests.</p>';
      return;
    }

    requests.forEach((user) => {
      const div = document.createElement('div');
      div.className = 'pending-request';
      div.innerHTML = `
        <span>${user.firstname} ${user.surname} (@${user.username})</span>
        <button type="button">Accept</button>
      `;

      div.querySelector('button').addEventListener('click', async () => {
        try {
          const acceptRes = await fetch('/api/friends/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ requesterUserId: user.userID })
          });

          const result = await acceptRes.json();

          if (!acceptRes.ok) {
            alert(result.error || 'Failed to accept request');
            return;
          }

          await loadPendingRequests();
          await loadLeaderboard();
        } catch (error) {
          console.error(error);
          alert('Failed to accept request');
        }
      });

      box.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    box.innerHTML = '<p>Failed to load requests.</p>';
  }
}

async function loadAverages() { // Load health metrics averages
  try {
    const res = await fetch('/api/user-averages');
    const data = await res.json();

    document.getElementById('avgRestHR').textContent = data.avgRestHR ? `${data.avgRestHR} bpm` : 'No data';
    document.getElementById('avgActiveHR').textContent = data.avgActiveHR ? `${data.avgActiveHR} bpm` : 'No data';
    document.getElementById('avgBP').textContent = (data.avgSystolic && data.avgDiastolic) ? `${data.avgSystolic}/${data.avgDiastolic} mmHg` : 'No data';
    document.getElementById('avgFluid').textContent = data.avgFluid ? `${data.avgFluid.toLocaleString()}ml/day` : 'No data';
  } catch (err) {
    console.error(err);
  }
}

/* managing weight goal */
async function loadWeightGoal() {
  try {
    const res = await fetch('/api/weight-goal');
    const data = await res.json();

    const progress = document.getElementById('weightProgress');
    const stats = document.getElementById('goalStats');
    const prompt = document.getElementById('goalSetPrompt');

    if (!data.weightGoal) {
      stats.textContent = 'No goal set yet.';
      progress.value = 0;
      prompt.textContent = 'Set a target weight below to track your progress.';
      return;
    }

    if (!data.startWeight) {
      stats.textContent = `Goal: ${data.weightGoal}kg — No weight records yet.`;
      progress.value = 0;
      return;
    }

    const start = data.startWeight;
    const current = data.currentWeight;
    const goal = data.weightGoal;

    // How much they need to lose total vs how much they've lost so far
    const totalToLose = start - goal;
    const lost = start - current;
    const percent = totalToLose > 0 ? Math.min(Math.round((lost / totalToLose) * 100), 100) : 0;

    progress.max = 100;
    progress.value = percent;
    stats.textContent = `Highest: ${start}kg | Current: ${current}kg | Goal: ${goal}kg (${percent}%)`;

    // Pre-fill the input with current goal
    document.getElementById('weightGoalInput').value = goal;

  } catch (err) {
    console.error(err);
  }
}

async function saveWeightGoal() {
  const input = document.getElementById('weightGoalInput').value;
  if (!input) return;

  const res = await fetch('/api/weight-goal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weightGoal: parseFloat(input) })
  });

  const data = await res.json();
  if (data.success) {
    showToast('Weight goal saved!', true);
    loadWeightGoal();
  } else {
    showToast('Failed to save goal', false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('friendSearchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', searchUsers);
  }

  loadPendingRequests();
  loadLeaderboard();
  loadAverages();
  loadWeightGoal()
});

