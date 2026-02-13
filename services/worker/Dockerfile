FROM python:3.12-slim AS base

RUN groupadd -r appuser && useradd -r -g appuser -u 1000 appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY dbt_project/ ./dbt_project/

RUN chown -R appuser:appuser /app
USER appuser

CMD ["python", "-m", "src.main"]
