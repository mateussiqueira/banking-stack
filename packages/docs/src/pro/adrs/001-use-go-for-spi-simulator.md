# ADR-001: Use Go for SPI Simulator

## Status

Accepted

## Context

Need high-performance payment processing for the SPI (Standardized Payment Interface) simulator. The system must handle high volumes of payment transactions concurrently while maintaining reliability and throughput.

## Decision

Use Go with goroutines for concurrent transaction processing.

## Consequences

- Good performance with goroutine-based concurrency
- Easy concurrency model with channels and goroutines
- Garbage collection is acceptable for this use case
- Strong standard library support for networking and HTTP
- Good tooling and ecosystem for payment processing
