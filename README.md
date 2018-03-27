# core-grpc-prometheus-connector

## Get started

The connector supports two parameters passed in from the connection string, `promHost=some-host:9090`, and `promQuery=some-promql-expression`. 

For example, `CUSTOM CONNECT TO "provider=prometheus-connector;promHost=my-prometheus-hostname:9090;promQuery={__name__=~'qix.+'}"`, will tell the connector to fetch Prometheus data from host `my-prometheus-hostname`, on port `9090` with a Prometheus query that will list all metrics that starts with `qix`.

### Run locally

Requires python3.

```bash
pip install -r requirements.txt
```

```bash
python src/.
```

#### Regenerating code

Update `./connector.proto` to a new version, then:

```bash
python gen_code.py
```

### Build Docker image

```bash
docker build . -t prom-connector
```

## Running the example

Requires Node.js version 9+.

```bash
cd example
ACCEPT_EULA=yes docker-compose up -d --build --force-recreate
cd ui
npm i
npx webpack --mode development
open dist/index.html
```

![Example](./example.png)
