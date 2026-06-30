# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go mod file
COPY go.mod go.sum* ./
RUN go mod download

# Copy source code
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /app/dict-simulator ./cmd/dict

# Runtime stage
FROM alpine:3.19

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=builder /app/dict-simulator .

EXPOSE 3003

CMD ["./dict-simulator"]
