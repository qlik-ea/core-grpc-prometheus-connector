const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/12.20.0.json');

const REFRESH_RATE_IN_SECONDS = 5;

async function reloadLoop(global, doc) {
  const reload = doc.doReload();
  const success = await reload;
  const progress = await global.getProgress(reload.requestId);
  console.log(JSON.stringify(progress));
  if (!success) {
    throw new Error('Reload failed!');
  }
  setTimeout(() => reloadLoop(global, doc), REFRESH_RATE_IN_SECONDS * 1000);
}

async function createSession(url) {
  const session = enigma.create({ url, schema });
  // session.on('traffic:*', console.log);
  const global = await session.open();
  const doc = await global.createSessionApp();

  await Promise.all([
    doc.createConnection({
      qType: 'prometheus-connector',
      qName: 'prom',
      qConnectionString: 'CUSTOM CONNECT TO "provider=prometheus-connector;promHost=prometheus:9090;promQuery="',
    }),
    doc.createConnection({
      qType: 'folder',
      qName: 'tmp',
      qConnectionString: '/tmp/',
    }),
  ]);

  const script = `
LET qvdExist = NOT ISNULL(QVDCREATETIME('lib://tmp/promdata.qvd'));
  
Prometheus_Data:
LIB CONNECT TO "prom"; SELECT;
IF $(qvdExist) THEN
  CONCATENATE LOAD * FROM [lib://tmp/promdata.qvd](qvd);
END IF

STORE Prometheus_Data INTO [lib://tmp/promdata.qvd](qvd);
  `;

  await doc.setScript(script);
  await reloadLoop(global, doc);
  return doc;
}

module.exports = createSession;
