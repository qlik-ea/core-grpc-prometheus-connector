import connector_pb2_grpc
import connector_pb2
import grpc
import prom

class Service(connector_pb2_grpc.ConnectorServicer):
  def GetMetaInfo(self, request, context):
    return connector_pb2.MetaInfo(
      name = 'Prometheus Connector',
      version = '0.0.1',
      developer = 'Qlik'
    )

  def GetData(self, request, context):
    # parse out configuration from connection string
    connectionData = dict(item.split("=") for item in request.connection.connectionString.split(";"))
    host = connectionData.get('promHost', '')
    query = connectionData.get('promQuery', '')

    if not host:
      # require promHost in connection string
      msg = 'Missing promHost=<host:port> in connection string'
      context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
      context.set_details(msg)
      raise grpc.RpcError(grpc.StatusCode.INVALID_ARGUMENT, msg)

    if not query:
      # default to all metrics
      query = '{__name__=~".+"}'

    print('Fetching data from Prometheus host "{}"...'.format(host))
    results = prom.fetch('http://{}/api/v1/query'.format(host), query)

    print('Data fetched, sending initial metadata...')
    metadata = prom.build_metadata(results)
    context.send_initial_metadata((('x-qlik-getdata-bin', metadata.SerializeToString()),))

    print('Initial metadata sent, sending chunks...')

    return prom.build_chunks(results, metadata)
