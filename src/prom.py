import requests
import connector_pb2
from datetime import timezone, datetime

scrape_timestamp = None

def build_metadata(results):
  """
  Builds up the MetaData object needed by engine to figure out which fields
  the data contain.
  """

  print('Building metadata...')

  fields = set(['name', 'timestamp', 'value', 'scrape_timestamp'])
  metadata = connector_pb2.GetDataResponse()

  for result in results:
    for metric in result['metric'].keys():
      if metric != '__name__':
        fields.add(metric)

  for field in fields:
    metadata.fieldInfo.extend([connector_pb2.FieldInfo(name = field)])

  return metadata

def set_value(result, fieldName, chunk):
  is_string = True
  value = None

  if fieldName == 'name':
    # we normalize the metric name from __name__
    value = result['metric'].get('__name__', '')
  elif fieldName == 'timestamp':
    # timestamp is the first value from each metric, and
    # indicates when the value was scraped from a service
    is_string = False
    value = result['value'][0]
  elif fieldName == 'value':
    # the actual value, we try to parse this as float but
    # default to string
    value = result['value'][1]
    try:
      value = float(value)
      is_string = False
    except ValueError:
      pass
  elif fieldName == 'scrape_timestamp':
    # we include a specific field for when this connector
    # scraped the information from Prometheus
    value = scrape_timestamp
    is_string = False
  else:
    # all other metric fields are dynamically read in, and
    # we try to parse it as float and default to string
    value = result['metric'].get(fieldName, '')
    if type(value) is float:
      is_string = False

  if is_string:
    if len(value) == 0:
      # empty values should be sent as null values
      chunk.stringCodes.append(-1)
      chunk.stringBucket.append('')
      chunk.numberCodes.append(-1)      
    else:
      # string values
      chunk.stringCodes.append(len(chunk.stringBucket))
      chunk.stringBucket.append(str(value))
      chunk.numberCodes.append(-1)
  else:
      # float values
    chunk.numberCodes.append(len(chunk.doubleBucket))
    chunk.doubleBucket.append(float(value))
    chunk.stringCodes.append(-1)

def build_chunks(results, metadata):
  """
  Builds up the DataChunk object, in this case we only build up one
  but we could also build up several if the data is too large for
  the streaming gRPC protocol.
  """

  for result in results:
    chunk = connector_pb2.DataChunk()
    for field in metadata.fieldInfo:
      set_value(result, field.name, chunk)
    yield chunk

def fetch(prom_url, query_expr):
  """
  Fetch data from Prometheus, transform it, and return gRPC-compatible
  data structures.
  """

  global scrape_timestamp
  scrape_timestamp = int(datetime.now(tz=timezone.utc).timestamp() * 1000)

  response = requests.get(prom_url, params={ 'query': query_expr })
  results = response.json()['data']['result']

  return results
