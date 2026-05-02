FROM python:3.11-slim
WORKDIR /app
COPY backend/monitoring/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY shared/ /app/shared/
COPY backend/monitoring/ .
ENTRYPOINT ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
