.PHONY: build run test clean docker

build:
	go build -o bin/ledger ./cmd/ledger

run:
	go run ./cmd/ledger

test:
	go test -v ./...

test-cover:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

clean:
	rm -rf bin/
	rm -f coverage.out

docker:
	docker build -t ledger-go .

docker-run:
	docker run -p 3001:3001 ledger-go

fmt:
	go fmt ./...

tidy:
	go mod tidy

deps:
	go mod download
