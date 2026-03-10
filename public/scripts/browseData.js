var chartInstances = {};
var healthData = [];

var metricGroups = {
  activity: {
    canvasID: 'activityChart',
    togglesID: 'activityToggles',
    metrics: {
      calories:    { label: 'Calories',   colour: 'rgb(255, 99, 132)', fill: 'rgba(255, 99, 132, 0.15)', active: true },
      steps:       { label: 'Steps',      colour: 'rgb(54, 162, 235)', fill: 'rgba(54, 162, 235, 0.15)', active: true },
      fluidIntake: { label: 'Fluid (ml)', colour: 'rgb(75, 192, 192)', fill: 'rgba(75, 192, 192, 0.15)', active: false }
    }
  },
  body: {
    canvasID: 'bodyChart',
    togglesID: 'bodyToggles',
    metrics: {
      weight: { label: 'Weight (kg)', colour: 'rgb(255, 159, 64)', fill: 'rgba(255, 159, 64, 0.15)', active: true }
    }
  },
  heart: {
    canvasID: 'heartChart',
    togglesID: 'heartToggles',
    metrics: {
      restHR:            { label: 'Resting HR', colour: 'rgb(153, 102, 255)', fill: 'rgba(153, 102, 255, 0.15)', active: true },
      activeHR:          { label: 'Active HR',  colour: 'rgb(255, 205, 86)', fill: 'rgba(255, 205, 86, 0.15)', active: true },
      systolicPressure:  { label: 'Systolic',   colour: 'rgb(201, 80, 80)',  fill: 'rgba(201, 80, 80, 0.15)',  active: false },
      diastolicPressure: { label: 'Diastolic',  colour: 'rgb(80, 130, 201)', fill: 'rgba(80, 130, 201, 0.15)', active: false }
    }
  }
};

function sanitise(input){
  var el = document.createElement('span');
  el.innerText = input;
  return el.innerHTML;
}

document.addEventListener("DOMContentLoaded", function(){
  var groupKeys = Object.keys(metricGroups);
  for(var g = 0; g < groupKeys.length; g++) buildToggleButtons(groupKeys[g]);

  document.getElementById('applyFilter').addEventListener('click', function(){ fetchAndRender() });

  var qBtns = document.querySelectorAll('.quickFilter');
  for(var i = 0; i < qBtns.length; i++){
    qBtns[i].addEventListener('click', function(){
      var numDays = parseInt(this.dataset.days);
      if(numDays === 0){
        document.getElementById('filterFrom').value = '';
        document.getElementById('filterTo').value = '';
      }else{
        var end = new Date();
        var start = new Date();
        start.setDate(end.getDate() - numDays);
        document.getElementById('filterFrom').value = start.toISOString().split('T')[0];
        document.getElementById('filterTo').value = end.toISOString().split('T')[0];
      }
      fetchAndRender();
    })
  }

  fetchAndRender();
});


function buildToggleButtons(groupName){
  var grp = metricGroups[groupName];
  var container = document.getElementById(grp.togglesID);
  container.innerHTML = '';
  var keys = Object.keys(grp.metrics);

  for(var i = 0; i < keys.length; i++){
    var k = keys[i];
    var cfg = grp.metrics[k];

    var btn = document.createElement('button');
    btn.className = 'metricToggle' + (cfg.active ? ' toggled' : '');
    btn.dataset.metric = k;
    btn.dataset.group = groupName;
    btn.textContent = cfg.label;
    btn.style.borderColor = cfg.colour;
    if(cfg.active) btn.style.backgroundColor = cfg.colour;

    btn.addEventListener('click', function(){
      var g = this.dataset.group;
      var m = this.dataset.metric;
      var metric = metricGroups[g].metrics[m];
      metric.active = !metric.active;

      if(metric.active){
        this.classList.add('toggled');
        this.style.backgroundColor = metric.colour;
      }else{
        this.classList.remove('toggled');
        this.style.backgroundColor = '';
      }
      rebuildGroupChart(g);
    });

    container.appendChild(btn)
  }
}

async function fetchAndRender(){
  var fromDate = document.getElementById('filterFrom').value;
  var toDate = document.getElementById('filterTo').value;

  var endpoint = '/api/user-records';
  var qBits = [];
  if(fromDate) qBits.push('from=' + fromDate);
  if(toDate) qBits.push('to=' + toDate);
  if(qBits.length > 0) endpoint += '?' + qBits.join('&');

  try {
    var response = await fetch(endpoint);
    if(response.status === 401){
      window.location.href = '/login';
      return;
    }
    if(!response.ok) throw new Error('server returned ' + response.status);

    healthData = await response.json();
  }catch(err){
    console.error('couldnt get records:', err);
    return
  }

  if(!healthData || healthData.length < 1){
    document.getElementById('noData').style.display = 'block';
    document.getElementById('chartsArea').style.display = 'none';
    return;
  }
  document.getElementById('noData').style.display = 'none';
  document.getElementById('chartsArea').style.display = 'block';

  var gKeys = Object.keys(metricGroups);
  for(var g = 0; g < gKeys.length; g++) rebuildGroupChart(gKeys[g]);

  buildSummaryCards();
}

function rebuildGroupChart(groupName){
  var grp = metricGroups[groupName];

  var dates = [];
  for(var i = 0; i < healthData.length; i++) dates.push(healthData[i].date);

  var datasets = [];
  var mKeys = Object.keys(grp.metrics);

  for(var k = 0; k < mKeys.length; k++){
    var key = mKeys[k];
    var cfg = grp.metrics[key]
    if(!cfg.active) continue;

    var vals = [];
    for(var i = 0; i < healthData.length; i++) vals.push(healthData[i][key]);

    datasets.push({
      label: cfg.label, data: vals,
      borderColor: cfg.colour, backgroundColor: cfg.fill,
      fill: true, tension: 0.3,
      pointRadius: 4, pointHoverRadius: 6, spanGaps: true
    });
  }

  if(chartInstances[groupName]){
    chartInstances[groupName].data.labels = dates;
    chartInstances[groupName].data.datasets = datasets;
    chartInstances[groupName].update();
    return
  }

  var ctx = document.getElementById(grp.canvasID).getContext('2d');
  chartInstances[groupName] = new Chart(ctx, {
    type: 'line',
    data: { labels: dates, datasets: datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { ticks: { color: '#666' }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: '#666' }, grid: { color: 'rgba(150,150,150,0.2)' }}
      },
      plugins: {
        legend: { labels: { color: '#666', usePointStyle: true }},
        tooltip: { mode: 'index', intersect: false }
      }
    }
  });
}

function buildSummaryCards(){
  var calVals = [], stepVals = [], fluidVals = [];

  for(var i = 0; i < healthData.length; i++){
    if(healthData[i].calories != null) calVals.push(healthData[i].calories);
    if(healthData[i].steps != null) stepVals.push(healthData[i].steps);
    if(healthData[i].fluidIntake != null) fluidVals.push(healthData[i].fluidIntake)
  }

  var calAvg = calVals.length > 0 ? Math.round(calVals.reduce(function(a,b){return a+b},0) / calVals.length) : 'N/A';
  var calTotal = calVals.length > 0 ? calVals.reduce(function(a,b){return a+b},0) : 'N/A';

  var stepAvg = stepVals.length > 0 ? Math.round(stepVals.reduce(function(a,b){return a+b},0) / stepVals.length) : 'N/A'
  var stepTotal = stepVals.length > 0 ? stepVals.reduce(function(a,b){return a+b},0) : 'N/A';

  var fluidAvg = fluidVals.length > 0 ? Math.round(fluidVals.reduce(function(a,b){return a+b},0) / fluidVals.length) : 'N/A';
  var fluidTotal = fluidVals.length > 0 ? fluidVals.reduce(function(a,b){return a+b},0) : 'N/A';

  var cont = document.getElementById('summaryStats');
  cont.innerHTML =
    '<div class="summaryCard"><h2>Calories</h2><p>Avg: '+sanitise(String(calAvg))+'</p><p>Total: '+sanitise(String(calTotal))+'</p></div>'+
    '<div class="summaryCard"><h2>Steps</h2><p>Avg: '+sanitise(String(stepAvg))+'</p><p>Total: '+sanitise(String(stepTotal))+'</p></div>'+
    '<div class="summaryCard"><h2>Fluids</h2><p>Avg: '+sanitise(String(fluidAvg))+' ml</p><p>Total: '+sanitise(String(fluidTotal))+' ml</p></div>';
}
