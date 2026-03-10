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
