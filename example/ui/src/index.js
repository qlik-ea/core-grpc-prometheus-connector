const picasso = require('picasso.js');
const picassoQ = require('picasso-plugin-q');

const createSession = require('./session');
const createMemoryChart = require('./picasso/memory-chart');
const createSessionChart = require('./picasso/sessions-chart');
const tooltipComponent = require('./picasso/tooltip-component');

picasso.use(picassoQ);
picasso.component('tooltip', tooltipComponent);

(async () => {
  const doc = await createSession(`ws://localhost:9076/app/${+new Date()}`);

  const memTitle = document.createElement('h1');
  memTitle.innerHTML = 'Memory (in bytes) per container';
  document.body.appendChild(memTitle);
  createMemoryChart(picasso, doc);

  const sessionTitle = document.createElement('h1');
  sessionTitle.innerHTML = 'Total number of sessions on engines';
  document.body.appendChild(sessionTitle);
  createSessionChart(picasso, doc);
})();
