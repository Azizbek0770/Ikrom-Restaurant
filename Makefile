.PHONY: help install dev build start stop restart logs clean migrate seed test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing admin dashboard dependencies..."
	cd admin_dashboard && npm install
	@echo "Installing customer app dependencies..."
	cd telegram_apps/customer_app && npm install
	@echo "Installing delivery app dependencies..."
	cd telegram_apps/delivery_app && npm install
	@echo "Installing customer bot dependencies..."
	cd telegram_apps/customer_bot && npm install
	@echo "Installing delivery bot dependencies..."
	cd telegram_apps/delivery_bot && npm install
	@echo "✅ All dependencies installed!"

dev: ## Start development servers
	@echo "Starting development servers..."
	make -j 4 dev-backend dev-admin dev-customer-app dev-delivery-app

dev-backend: ## Start backend in dev mode
	cd backend && npm run dev

dev-admin: ## Start admin dashboard in dev mode
	cd admin_dashboard && npm run dev

dev-customer-app: ## Start customer app in dev mode
	cd telegram_apps/customer_app && npm run dev

dev-delivery-app: ## Start delivery app in dev mode
	cd telegram_apps/delivery_app && npm run dev

build: ## Build all Docker images
	@echo "Building Docker images..."
	docker-compose build

start: ## Start all services with Docker
	@echo "Starting all services..."
	docker-compose up -d
	@echo "✅ All services started!"
	@echo "Backend: http://localhost:5000"
	@echo "Admin Dashboard: http://localhost:3000"

stop: ## Stop all services
	@echo "Stopping all services..."
	docker-compose down
	@echo "✅ All services stopped!"

restart: ## Restart all services
	make stop
	make start

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-admin: ## View admin dashboard logs
	docker-compose logs -f admin_dashboard

logs-bots: ## View bot logs
	docker-compose logs -f customer_bot delivery_bot

clean: ## Remove all containers, volumes, and images
	@echo "Cleaning up..."
	docker-compose down -v
	docker system prune -f
	@echo "✅ Cleanup complete!"

migrate: ## Run database migrations
	@echo "Running migrations..."
	cd backend && npm run migrate
	@echo "✅ Migrations complete!"

seed: ## Seed database with initial data
	@echo "Seeding database..."
	cd backend && npm run seed
	@echo "✅ Database seeded!"

test: ## Run all tests
	@echo "Running backend tests..."
	cd backend && npm test
	@echo "✅ Tests complete!"

setup: install migrate seed ## Complete initial setup
	@echo "✅ Initial setup complete!"

status: ## Check status of all services
	docker-compose ps

health: ## Check health of all services
	@echo "Checking service health..."
	@curl -s http://localhost:5000/health | jq . || echo "Backend not responding"
	@echo ""

backup-db: ## Backup database
	@echo "Backing up database..."
	@mkdir -p backups
	docker-compose exec -T postgres pg_dump -U postgres food_delivery_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backed up to backups/"

restore-db: ## Restore database from backup (usage: make restore-db FILE=backup_file.sql)
	@echo "Restoring database from $(FILE)..."
	docker-compose exec -T postgres psql -U postgres food_delivery_db < $(FILE)
	@echo "✅ Database restored!"