FROM python:3.7

RUN mkdir /app
WORKDIR /app
ADD ./requirements.txt .
RUN pip install --trusted-host pypi.python.org -r requirements.txt
ADD src/. .
CMD ["python", "-u", "."]
