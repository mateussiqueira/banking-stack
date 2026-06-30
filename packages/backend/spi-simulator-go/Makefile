.PHONY: build run test clean docker

# Build the binary
build:
	go build -o bin/spi-simulator ./cmd/spi

# Run the server
run:
	go run ./cmd/spi

# Run tests
test:
	go test -v ./...

# Run tests with coverage
test-cover:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f coverage.out

# Docker build
docker:
	docker build -t spi-simulator-go .

# Docker run
docker-run:
	docker run -p 3002:3002 spi-simulator-go

# Format code
fmt:
	go fmt ./...

# Run linter
lint:
	golangci-lint run

# Tidy dependencies
tidy:
	go mod tidy

# Download dependencies
deps:
	go mod download
