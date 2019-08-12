async function createObject(doc) {
  return doc.createSessionObject({
    qInfo: {
      qType: 'vis',
    },
    qHyperCubeDef: {
      qDimensions: [
        { qDef: { qFieldDefs: ['name'] } },
        { qDef: { qFieldDefs: ['scrape_timestamp'] } },
      ],
      qMeasures: [
        { qDef: { qDef: "Sum({$<name={'qix_sessions_total'}>}value)" } },
      ],
      qInitialDataFetch: [{
        qWidth: 3,
        qHeight: 1000,
      }],
    },
  });
}

async function createChart(picasso, doc) {
  const elem = document.createElement('div');
  elem.id = `vis_${+new Date()}`;
  elem.className = 'vis';
  document.body.appendChild(elem);
  const obj = await createObject(doc);
  const chart = picasso.chart({
    element: elem,
    settings: {
      scales: {
        y: {
          data: { field: 'qMeasureInfo/0' },
          invert: true,
          min: 0,
          expand: 1,
        },
        t: {
          data: { field: 'qDimensionInfo/1' },
          type: 'linear',
        },
      },
      components: [{
        key: 'ax1',
        type: 'axis',
        dock: 'left',
        scale: 'y',
      }, {
        key: 'ax2',
        type: 'axis',
        dock: 'right',
        scale: 'y',
      }, {
        key: 'ax3',
        type: 'axis',
        dock: 'bottom',
        scale: 't',
        formatter: {
          type: 'd3-time',
          format: '%H:%M:%S',
        },
      }, {
        type: 'grid-line',
        x: {
          scale: 'x',
        },
        y: {
          scale: 'y',
        },
      }, {
        key: 'lines',
        type: 'line',
        data: {
          extract: {
            field: 'qDimensionInfo/1',
            value: (v) => v.qNum,
            props: {
              v: { field: 'qMeasureInfo/0' },
            },
          },
        },
        settings: {
          coordinates: {
            major: { scale: 't' },
            minor: { scale: 'y', ref: 'v' },
          },
          layers: {
            line: {},
            area: {},
          },
        },
      }],
    },
  });

  obj.on('changed', async () => {
    const layout = await obj.getLayout();
    console.log(layout.qHyperCube);
    chart.update({
      data: [{
        type: 'q',
        data: layout.qHyperCube,
      }],
    });
  });

  obj.emit('changed');
}

module.exports = createChart;
