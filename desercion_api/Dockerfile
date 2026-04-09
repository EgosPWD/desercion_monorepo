FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y \
  gcc \
  g++ \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
  pip install --no-cache-dir -r requirements.txt

COPY main.py .
COPY database.py .
COPY modelo/ ./modelo/

RUN useradd --create-home --shell /bin/bash appuser && \
  chown -R appuser:appuser /app

USER appuser

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV PORT=8183
ENV DB_HOST=localhost
ENV DB_PORT=5433
ENV DB_NAME=desercion_db
ENV DB_USER=desercion_user
ENV DB_PASSWORD=
ENV JWT_SECRET_KEY=
ENV JWT_EXPIRE_MINUTES=121

EXPOSE 8183

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
