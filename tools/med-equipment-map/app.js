// ===== THEME TOGGLE =====
(function(){
  const t=document.querySelector('[data-theme-toggle]'),r=document.documentElement;
  let d=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';
  r.setAttribute('data-theme',d);
  function updateIcon(){
    if(!t)return;
    t.innerHTML=d==='dark'
      ?'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      :'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
  updateIcon();
  t&&t.addEventListener('click',()=>{d=d==='dark'?'light':'dark';r.setAttribute('data-theme',d);updateIcon();
    // Rebuild charts on theme change
    setTimeout(()=>{buildCharts();updateMap();},100);
  });
})();

// ===== TAB NAVIGATION =====
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
  });
});

// ===== STATE DATA =====
// Estimated medical equipment spending derived from:
// - CMS healthcare expenditure by state (2020 latest available)
// - Hospital count data (AHA)
// - Medical device industry employment (US Cluster Mapping)
// - Population proportional allocation of the $70.7B DME market
const stateData = {
  "Alabama":       {abbr:"AL",totalSpend:2.1,perCapita:9180,hospitals:98,deviceJobs:3800,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:5.07},
  "Alaska":        {abbr:"AK",totalSpend:0.5,perCapita:13200,hospitals:21,deviceJobs:420,topBuyer:"Hospitals",topEquip:"Diagnostic Imaging",pop:0.73},
  "Arizona":       {abbr:"AZ",totalSpend:3.2,perCapita:8400,hospitals:80,deviceJobs:8900,topBuyer:"ASCs",topEquip:"Surgical Instruments",pop:7.43},
  "Arkansas":      {abbr:"AR",totalSpend:1.3,perCapita:8800,hospitals:87,deviceJobs:1900,topBuyer:"Hospitals",topEquip:"Patient Monitoring",pop:3.05},
  "California":    {abbr:"CA",totalSpend:18.5,perCapita:10600,hospitals:418,deviceJobs:72471,topBuyer:"Hospitals",topEquip:"Diagnostic Imaging",pop:39.03},
  "Colorado":      {abbr:"CO",totalSpend:2.6,perCapita:8700,hospitals:82,deviceJobs:7200,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:5.91},
  "Connecticut":   {abbr:"CT",totalSpend:2.4,perCapita:12800,hospitals:29,deviceJobs:6100,topBuyer:"Hospitals",topEquip:"Cardiovascular",pop:3.63},
  "Delaware":      {abbr:"DE",totalSpend:0.6,perCapita:11200,hospitals:8,deviceJobs:1200,topBuyer:"Hospitals",topEquip:"Lab Equipment",pop:1.02},
  "Florida":       {abbr:"FL",totalSpend:11.8,perCapita:10200,hospitals:222,deviceJobs:18500,topBuyer:"Hospitals",topEquip:"Cardiovascular",pop:22.61},
  "Georgia":       {abbr:"GA",totalSpend:4.4,perCapita:7800,hospitals:158,deviceJobs:8200,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:11.02},
  "Hawaii":        {abbr:"HI",totalSpend:0.7,perCapita:9600,hospitals:24,deviceJobs:980,topBuyer:"Hospitals",topEquip:"Diagnostic Imaging",pop:1.44},
  "Idaho":         {abbr:"ID",totalSpend:0.7,perCapita:7600,hospitals:42,deviceJobs:1400,topBuyer:"Private Practice",topEquip:"Exam Equipment",pop:1.97},
  "Illinois":      {abbr:"IL",totalSpend:6.8,perCapita:10400,hospitals:186,deviceJobs:22000,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:12.55},
  "Indiana":       {abbr:"IN",totalSpend:3.2,perCapita:9800,hospitals:126,deviceJobs:28500,topBuyer:"Hospitals",topEquip:"Orthopedic Implants",pop:6.88},
  "Iowa":          {abbr:"IA",totalSpend:1.5,perCapita:9600,hospitals:118,deviceJobs:3800,topBuyer:"Hospitals",topEquip:"Patient Monitoring",pop:3.21},
  "Kansas":        {abbr:"KS",totalSpend:1.3,perCapita:9200,hospitals:131,deviceJobs:2600,topBuyer:"Hospitals",topEquip:"Diagnostic Imaging",pop:2.94},
  "Kentucky":      {abbr:"KY",totalSpend:2.2,perCapita:9400,hospitals:96,deviceJobs:3200,topBuyer:"Hospitals",topEquip:"Respiratory",pop:4.53},
  "Louisiana":     {abbr:"LA",totalSpend:2.3,perCapita:9600,hospitals:130,deviceJobs:2800,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:4.62},
  "Maine":         {abbr:"ME",totalSpend:0.8,perCapita:11400,hospitals:36,deviceJobs:1100,topBuyer:"Hospitals",topEquip:"Patient Monitoring",pop:1.39},
  "Maryland":      {abbr:"MD",totalSpend:3.4,perCapita:10800,hospitals:47,deviceJobs:6800,topBuyer:"Hospitals",topEquip:"Diagnostic Imaging",pop:6.19},
  "Massachusetts": {abbr:"MA",totalSpend:5.6,perCapita:13400,hospitals:68,deviceJobs:29800,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:7.03},
  "Michigan":      {abbr:"MI",totalSpend:4.8,perCapita:9800,hospitals:141,deviceJobs:12500,topBuyer:"Hospitals",topEquip:"Cardiovascular",pop:10.04},
  "Minnesota":     {abbr:"MN",totalSpend:3.8,perCapita:11000,hospitals:133,deviceJobs:35600,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:5.77},
  "Mississippi":   {abbr:"MS",totalSpend:1.2,perCapita:8800,hospitals:82,deviceJobs:1600,topBuyer:"Hospitals",topEquip:"Patient Monitoring",pop:2.94},
  "Missouri":      {abbr:"MO",totalSpend:2.9,perCapita:9400,hospitals:120,deviceJobs:5800,topBuyer:"Hospitals",topEquip:"Diagnostic Imaging",pop:6.20},
  "Montana":       {abbr:"MT",totalSpend:0.5,perCapita:9800,hospitals:49,deviceJobs:680,topBuyer:"Hospitals",topEquip:"Diagnostic Imaging",pop:1.12},
  "Nebraska":      {abbr:"NE",totalSpend:0.9,perCapita:9800,hospitals:91,deviceJobs:2400,topBuyer:"Hospitals",topEquip:"Patient Monitoring",pop:1.97},
  "Nevada":        {abbr:"NV",totalSpend:1.4,perCapita:7800,hospitals:37,deviceJobs:2100,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:3.19},
  "New Hampshire": {abbr:"NH",totalSpend:0.9,perCapita:12200,hospitals:26,deviceJobs:2800,topBuyer:"Hospitals",topEquip:"Orthopedic Implants",pop:1.40},
  "New Jersey":    {abbr:"NJ",totalSpend:5.2,perCapita:10600,hospitals:71,deviceJobs:18200,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:9.29},
  "New Mexico":    {abbr:"NM",totalSpend:0.8,perCapita:8200,hospitals:38,deviceJobs:1200,topBuyer:"Hospitals",topEquip:"Diagnostic Imaging",pop:2.12},
  "New York":      {abbr:"NY",totalSpend:12.4,perCapita:12600,hospitals:188,deviceJobs:16800,topBuyer:"Hospitals",topEquip:"Diagnostic Imaging",pop:19.57},
  "North Carolina":{abbr:"NC",totalSpend:4.6,perCapita:8600,hospitals:117,deviceJobs:9400,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:10.70},
  "North Dakota":  {abbr:"ND",totalSpend:0.4,perCapita:12800,hospitals:37,deviceJobs:780,topBuyer:"Hospitals",topEquip:"Diagnostic Imaging",pop:0.78},
  "Ohio":          {abbr:"OH",totalSpend:5.8,perCapita:10200,hospitals:175,deviceJobs:14200,topBuyer:"Hospitals",topEquip:"Cardiovascular",pop:11.78},
  "Oklahoma":      {abbr:"OK",totalSpend:1.6,perCapita:8600,hospitals:115,deviceJobs:2400,topBuyer:"Hospitals",topEquip:"Patient Monitoring",pop:4.05},
  "Oregon":        {abbr:"OR",totalSpend:1.9,perCapita:9200,hospitals:59,deviceJobs:4800,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:4.24},
  "Pennsylvania":  {abbr:"PA",totalSpend:7.6,perCapita:11200,hospitals:175,deviceJobs:20100,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:12.96},
  "Rhode Island":  {abbr:"RI",totalSpend:0.6,perCapita:11600,hospitals:11,deviceJobs:1400,topBuyer:"Hospitals",topEquip:"Lab Equipment",pop:1.10},
  "South Carolina":{abbr:"SC",totalSpend:2.2,perCapita:8400,hospitals:67,deviceJobs:4200,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:5.37},
  "South Dakota":  {abbr:"SD",totalSpend:0.4,perCapita:10600,hospitals:48,deviceJobs:1100,topBuyer:"Hospitals",topEquip:"Patient Monitoring",pop:0.91},
  "Tennessee":     {abbr:"TN",totalSpend:3.6,perCapita:9400,hospitals:133,deviceJobs:7800,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:7.09},
  "Texas":         {abbr:"TX",totalSpend:13.2,perCapita:8200,hospitals:426,deviceJobs:24800,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:30.50},
  "Utah":          {abbr:"UT",totalSpend:1.2,perCapita:7200,hospitals:49,deviceJobs:5400,topBuyer:"Hospitals",topEquip:"Orthopedic Implants",pop:3.42},
  "Vermont":       {abbr:"VT",totalSpend:0.4,perCapita:11800,hospitals:14,deviceJobs:680,topBuyer:"Hospitals",topEquip:"Patient Monitoring",pop:0.65},
  "Virginia":      {abbr:"VA",totalSpend:4.0,perCapita:9000,hospitals:93,deviceJobs:7600,topBuyer:"Hospitals",topEquip:"Diagnostic Imaging",pop:8.68},
  "Washington":    {abbr:"WA",totalSpend:3.6,perCapita:9400,hospitals:91,deviceJobs:9800,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:7.81},
  "West Virginia": {abbr:"WV",totalSpend:0.9,perCapita:10800,hospitals:54,deviceJobs:1200,topBuyer:"Hospitals",topEquip:"Patient Monitoring",pop:1.77},
  "Wisconsin":     {abbr:"WI",totalSpend:3.0,perCapita:9800,hospitals:127,deviceJobs:8400,topBuyer:"Hospitals",topEquip:"Surgical Instruments",pop:5.93},
  "Wyoming":       {abbr:"WY",totalSpend:0.3,perCapita:10200,hospitals:25,deviceJobs:320,topBuyer:"Hospitals",topEquip:"Diagnostic Imaging",pop:0.58},
  "District of Columbia":{abbr:"DC",totalSpend:0.8,perCapita:16400,hospitals:10,deviceJobs:1200,topBuyer:"Hospitals",topEquip:"Lab Equipment",pop:0.69}
};

// FIPS codes for matching with TopoJSON
const stateFips = {
  "01":"Alabama","02":"Alaska","04":"Arizona","05":"Arkansas","06":"California",
  "08":"Colorado","09":"Connecticut","10":"Delaware","11":"District of Columbia",
  "12":"Florida","13":"Georgia","15":"Hawaii","16":"Idaho","17":"Illinois",
  "18":"Indiana","19":"Iowa","20":"Kansas","21":"Kentucky","22":"Louisiana",
  "23":"Maine","24":"Maryland","25":"Massachusetts","26":"Michigan","27":"Minnesota",
  "28":"Mississippi","29":"Missouri","30":"Montana","31":"Nebraska","32":"Nevada",
  "33":"New Hampshire","34":"New Jersey","35":"New Mexico","36":"New York",
  "37":"North Carolina","38":"North Dakota","39":"Ohio","40":"Oklahoma","41":"Oregon",
  "42":"Pennsylvania","44":"Rhode Island","45":"South Carolina","46":"South Dakota",
  "47":"Tennessee","48":"Texas","49":"Utah","50":"Vermont","51":"Virginia",
  "53":"Washington","54":"West Virginia","55":"Wisconsin","56":"Wyoming"
};

// ===== MAP =====
let mapSvg, mapPath, mapProjection, mapG, mapData;

async function initMap(){
  const container = document.getElementById('mapContainer');
  const w = container.clientWidth;
  const h = container.clientHeight || 400;

  mapSvg = d3.select('#mapContainer').append('svg')
    .attr('viewBox', `0 0 ${w} ${h}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('width','100%').style('height','100%');

  mapProjection = d3.geoAlbersUsa().fitSize([w, h], {type:"Sphere"});
  mapPath = d3.geoPath().projection(mapProjection);
  mapG = mapSvg.append('g');

  try {
    const us = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
    mapData = topojson.feature(us, us.objects.states);
    // Fit projection to actual geometry
    mapProjection.fitSize([w, h], mapData);
    mapPath = d3.geoPath().projection(mapProjection);
    drawMap();
  } catch(e) {
    console.error('Failed to load map data', e);
    container.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:2rem;">Map data could not be loaded.</p>';
  }
}

function getMetricValue(state, metric){
  const d = stateData[state];
  if(!d) return 0;
  return d[metric] || 0;
}

function drawMap(){
  const metric = document.getElementById('mapMetric').value;
  const values = Object.values(stateData).map(d=>d[metric]);
  const extent = d3.extent(values);

  const cs = getComputedStyle(document.documentElement);
  const colorLow = cs.getPropertyValue('--map-low').trim();
  const colorMid = cs.getPropertyValue('--map-mid').trim();
  const colorHigh = cs.getPropertyValue('--map-high').trim();
  const strokeColor = cs.getPropertyValue('--map-stroke').trim();

  const colorScale = d3.scaleLinear()
    .domain([extent[0], (extent[0]+extent[1])/2, extent[1]])
    .range([colorLow, colorMid, colorHigh]);

  const paths = mapG.selectAll('path').data(mapData.features, d=>d.id);

  paths.enter().append('path')
    .attr('d', mapPath)
    .attr('stroke', strokeColor)
    .attr('stroke-width', 0.5)
    .attr('cursor', 'pointer')
    .on('mousemove', handleMouseMove)
    .on('mouseleave', handleMouseLeave)
    .merge(paths)
    .transition().duration(400)
    .attr('fill', d=>{
      const name = stateFips[d.id] || stateFips[String(d.id).padStart(2,'0')];
      const val = getMetricValue(name, metric);
      return val ? colorScale(val) : '#ccc';
    })
    .attr('stroke', strokeColor);

  paths.exit().remove();
}

function updateMap(){
  drawMap();
}

document.getElementById('mapMetric').addEventListener('change', updateMap);

const tooltip = document.getElementById('mapTooltip');

function handleMouseMove(event, d){
  const name = stateFips[d.id] || stateFips[String(d.id).padStart(2,'0')];
  const data = stateData[name];
  if(!data) return;

  const metric = document.getElementById('mapMetric').value;
  const metricLabels = {
    totalSpend: 'Est. Med Equip Spend',
    perCapita: 'HC Spend per Capita',
    hospitals: 'Number of Hospitals',
    deviceJobs: 'Med Device Jobs'
  };

  const metricFormats = {
    totalSpend: v => '$'+v+'B',
    perCapita: v => '$'+v.toLocaleString(),
    hospitals: v => v.toLocaleString(),
    deviceJobs: v => v.toLocaleString()
  };

  tooltip.innerHTML = `
    <div class="tooltip-title">${name}</div>
    <div class="tooltip-row"><span>${metricLabels[metric]}:</span><span>${metricFormats[metric](data[metric])}</span></div>
    <div class="tooltip-row"><span>Population:</span><span>${data.pop}M</span></div>
    <div class="tooltip-row"><span>Hospitals:</span><span>${data.hospitals}</span></div>
    <div class="tooltip-row"><span>Top Buyer:</span><span>${data.topBuyer}</span></div>
    <div class="tooltip-row"><span>Top Equipment:</span><span>${data.topEquip}</span></div>
  `;

  tooltip.classList.add('visible');
  const tx = Math.min(event.clientX + 16, window.innerWidth - 340);
  const ty = Math.min(event.clientY + 16, window.innerHeight - 200);
  tooltip.style.left = tx + 'px';
  tooltip.style.top = ty + 'px';

  d3.select(event.target).attr('stroke','var(--map-hover)').attr('stroke-width',2).raise();
}

function handleMouseLeave(event){
  tooltip.classList.remove('visible');
  const cs = getComputedStyle(document.documentElement);
  d3.select(event.target).attr('stroke',cs.getPropertyValue('--map-stroke').trim()).attr('stroke-width',0.5);
}

// ===== STATES TABLE =====
function buildStatesTable(){
  const sorted = Object.entries(stateData)
    .sort((a,b)=>b[1].totalSpend - a[1].totalSpend)
    .slice(0,15);

  const tbody = document.querySelector('#statesTable tbody');
  tbody.innerHTML = sorted.map(([name,d],i)=>`
    <tr>
      <td>${i+1}</td>
      <td><strong>${name}</strong></td>
      <td>$${d.totalSpend}B</td>
      <td>$${d.perCapita.toLocaleString()}</td>
      <td>${d.hospitals}</td>
      <td>${d.topBuyer}</td>
      <td>${d.topEquip}</td>
    </tr>
  `).join('');
}

// ===== CHARTS =====
let buyerChart, equipChart;

function buildCharts(){
  const cs = getComputedStyle(document.documentElement);
  const textColor = cs.getPropertyValue('--color-text').trim();
  const mutedColor = cs.getPropertyValue('--color-text-muted').trim();
  const primary = cs.getPropertyValue('--color-primary').trim();
  const accent = cs.getPropertyValue('--color-accent').trim();
  const success = cs.getPropertyValue('--color-success').trim();
  const warning = cs.getPropertyValue('--color-warning').trim();
  const purple = cs.getPropertyValue('--color-purple').trim();
  const orange = cs.getPropertyValue('--color-orange').trim();
  const surfaceOffset = cs.getPropertyValue('--color-surface-offset').trim();

  Chart.defaults.color = mutedColor;
  Chart.defaults.font.family = "'Inter', sans-serif";

  // BUYER DONUT
  if(buyerChart) buyerChart.destroy();
  const ctx1 = document.getElementById('buyerDonut').getContext('2d');
  buyerChart = new Chart(ctx1, {
    type:'doughnut',
    data:{
      labels:['Hospitals (62%)','ASC / Clinics (18%)','Private Practice (12%)','Gov & Research (8%)'],
      datasets:[{
        data:[62,18,12,8],
        backgroundColor:[primary,success,warning,purple],
        borderWidth:2,
        borderColor: cs.getPropertyValue('--color-surface').trim()
      }]
    },
    options:{
      responsive:true,
      cutout:'65%',
      plugins:{
        legend:{position:'bottom',labels:{padding:16,usePointStyle:true,pointStyle:'circle',font:{size:12}}}
      }
    }
  });

  // EQUIPMENT DONUT
  if(equipChart) equipChart.destroy();
  const ctx2 = document.getElementById('equipDonut').getContext('2d');
  equipChart = new Chart(ctx2, {
    type:'doughnut',
    data:{
      labels:['Surgical/OR (42.3%)','ICU/Critical (19.2%)','Emergency (14.4%)','Med/Surg Units (13.2%)','Lab (7.9%)','Pharmacy (3.0%)'],
      datasets:[{
        data:[42.3,19.2,14.4,13.2,7.9,3.0],
        backgroundColor:[primary,accent,success,warning,purple,orange],
        borderWidth:2,
        borderColor: cs.getPropertyValue('--color-surface').trim()
      }]
    },
    options:{
      responsive:true,
      cutout:'65%',
      plugins:{
        legend:{position:'bottom',labels:{padding:12,usePointStyle:true,pointStyle:'circle',font:{size:11}}}
      }
    }
  });

  // DEPARTMENT BARS
  const deptData = [
    {label:'Operating Room',value:42.3,color:primary},
    {label:'Intensive Care Unit',value:19.2,color:accent},
    {label:'Emergency Dept',value:14.4,color:success},
    {label:'Med/Surgical Units',value:13.2,color:warning},
    {label:'Laboratory',value:7.9,color:purple},
    {label:'Pharmacy',value:3.0,color:orange}
  ];

  const deptContainer = document.getElementById('deptBars');
  deptContainer.innerHTML = deptData.map(d=>`
    <div class="bar-row">
      <span class="bar-label">${d.label}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width:${d.value/42.3*100}%;background:${d.color};">
          <span class="bar-value">${d.value}%</span>
        </div>
      </div>
    </div>
  `).join('');

  // COST BARS
  const costData = [
    {label:'Surgical Robot System',value:100,display:'$1M - $4.9M',color:primary},
    {label:'MRI Scanner',value:60,display:'$500K - $3M',color:accent},
    {label:'CT Scanner',value:40,display:'$200K - $2.5M',color:success},
    {label:'ECMO System',value:18,display:'~$85K',color:warning},
    {label:'ICU Bed',value:8,display:'$25K - $30K',color:purple},
    {label:'Ventilator',value:12,display:'$5K - $50K',color:orange},
    {label:'Patient Monitor',value:5,display:'$5K - $25K',color:primary},
    {label:'Exam Table',value:2,display:'$500 - $5K',color:accent}
  ];

  const costContainer = document.getElementById('costBars');
  costContainer.innerHTML = costData.map(d=>`
    <div class="bar-row">
      <span class="bar-label">${d.label}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width:${d.value}%;background:${d.color};">
          <span class="bar-value">${d.display}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', ()=>{
  initMap();
  buildStatesTable();
  buildCharts();
});
