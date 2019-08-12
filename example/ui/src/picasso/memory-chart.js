async function createObject(doc) {
  return doc.createSessionObject({
    qInfo: {
      qType: 'vis',
    },
    qHyperCubeDef: {
      qDimensions: [
        { qDef: { qFieldDefs: ['name'] } },
        { qDef: { qFieldDefs: ['scrape_timestamp'] } },
        { qDef: { qFieldDefs: ['container_label_com_docker_compose_service'], qFieldLabels: ['Container'] }, qNullSuppression: true },
      ],
      qMeasures: [
        { qDef: { qDef: "Sum({$<name={'container_memory_usage_bytes'}>}value)" } },
      ],
      qInitialDataFetch: [{
        qWidth: 4,
        qHeight: 2000,
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
          expand: 0.1,
        },
        t: {
          data: { field: 'qDimensionInfo/1' },
          type: 'linear',
        },
        color: {
          data: { extract: { field: 'qDimensionInfo/2' } },
          type: 'color',
        },
      },
      interactions: [
        {
          type: 'native',
          events: {
            mousemove(e) {
              this.chart.component('tooltip').emit('hover', e);
            },
          },
        },
      ],
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
          scale: 't',
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
              id: { field: 'qDimensionInfo/2' },
            },
          },
        },
        settings: {
          coordinates: {
            major: { scale: 't' },
            minor: { scale: 'y', ref: 'v' },
            layerId: (v) => v.datum.id.value,
          },
          layers: {
            line: {
              stroke: { scale: 'color', ref: 'id' },
            },
            // area: {},
          },
        },
      }, {
        key: 'points',
        type: 'point',
        data: {
          extract: {
            field: 'qDimensionInfo/1',
            value: (v) => v.qNum,
            props: {
              text: { field: 'qDimensionInfo/2' },
              y: { field: 'qMeasureInfo/0' },
            },
          },
        },
        settings: {
          x: { scale: 't' },
          y: { scale: 'y' },
          size(/* d, i */) {
            return 0.25;
          },
          fill(/* d, i */) {
            return 'rgba(200, 50, 50, 0.2)';
          },
        },
      }, {
        key: 'legend',
        type: 'legend-cat',
        scale: 'color',
        dock: 'right',
      }, {
        key: 'tooltip',
        type: 'tooltip',
        background: 'white', // Override our default setting
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
