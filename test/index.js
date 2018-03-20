const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/12.20.0.json');
const WebSocket = require('ws');

const url = 'ws://localhost:9076/app/';
const session = enigma.create({ schema, url, createSocket: url => new WebSocket(url) });

session.on('traffic:*', (dir, data) => console.log(dir === 'sent' ? '->' : '<-', JSON.stringify(data)));

async function run() {
  const script = 'Prometheus_Data:\nLIB CONNECT TO "prom"; SELECT;';
  const global = await session.open();
  const doc = await global.createSessionApp();
  await doc.createConnection({
    qType: 'prometheus-connector',
    qName: 'prom',
    qConnectionString: 'CUSTOM CONNECT TO "provider=prometheus-connector;promHost=prometheus:9090;promQuery="',
  });
  
  await doc.setScript(script);
  const reload = doc.doReload();
  const success = await reload;
  const progress = await global.getProgress(reload.requestId);
  if (!success) {
    throw new Error('Reload failed!');
  }
  const numberOfRows = parseFloat(progress.qTransientProgressMessage.qMessageParameters[0].replace(/,/g, ''));
  if (numberOfRows > 0) {
    console.log(`${'-'.repeat(78)}\nTotal number of ${numberOfRows} rows fetched from the Prometheus connector.`);
  } else {
    throw new Error('No rows loaded!');
  }
  await session.close();
}

(async () => {
  try {
    await run();
  } catch(err) {
    console.log(err);
    process.exit(1);
  }
})();
