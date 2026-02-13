.PHONY: up down build seed logs ps test clean

# Start all services
up:
	docker compose up -d

# Start with rebuild
up-build:
	docker compose up -d --build

# Stop all services
down:
	docker compose down

# Stop and remove volumes
clean:
	docker compose down -v

# Rebuild all images
build:
	docker compose build

# Seed database via ingest service
seed:
	curl -s -X POST http://localhost:8001/api/seed | python3 -m json.tool

# Fetch quizzes from Open Trivia DB
fetch-quizzes:
	curl -s -X POST http://localhost:8001/api/fetch-quizzes | python3 -m json.tool

# View logs
logs:
	docker compose logs -f

# View logs for specific service
logs-%:
	docker compose logs -f $*

# Show running services
ps:
	docker compose ps

# Run ingest tests
test-ingest:
	docker compose exec ingest pytest tests/ -v

# Run all Python tests
test:
	docker compose exec ingest pytest tests/ -v

# Connect to database
db:
	docker compose exec postgres psql -U kidlearn -d kidlearn

# Run DBT (Phase 2)
dbt-run:
	docker compose exec worker dbt run --project-dir /app/dbt_project --profiles-dir /app/dbt_project
