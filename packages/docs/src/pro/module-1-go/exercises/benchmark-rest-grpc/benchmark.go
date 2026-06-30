//go:build ignore

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math"
	"net/rpc"
	"sort"
	"strconv"
	"strings"
	"time"
	"net/http"
)

type Request struct {
	ID     string  `json:"id"`
	Amount float64 `json:"amount"`
	Type   string  `json:"type"`
}

type Response struct {
	ID          string  `json:"id"`
	Status      string  `json:"status"`
	Amount      float64 `json:"amount"`
	ProcessedAt string  `json:"processed_at"`
}

type Results struct {
	Avg  time.Duration
	P95  time.Duration
	P99  time.Duration
	Min  time.Duration
	Max  time.Duration
}

func measureREST(n int) Results {
	latencies := make([]time.Duration, n)
	body := Request{ID: "tx-001", Amount: 100.0, Type: "credit"}
	payload, _ := json.Marshal(body)

	for i := 0; i < n; i++ {
		start := time.Now()
		resp, err := http.Post("http://localhost:9091/process", "application/json", bytes.NewReader(payload))
		if err != nil {
			panic("REST request failed: " + err.Error())
		}
		json.NewDecoder(resp.Body).Decode(&Response{})
		resp.Body.Close()
		latencies[i] = time.Since(start)
	}

	return computeStats(latencies)
}

func measureRPC(n int) Results {
	latencies := make([]time.Duration, n)

	for i := 0; i < n; i++ {
		client, err := rpc.Dial("tcp", "localhost:9092")
		if err != nil {
			panic("RPC dial failed: " + err.Error())
		}

		req := Request{ID: "tx-001", Amount: 100.0, Type: "credit"}
		var resp Response

		start := time.Now()
		err = client.Call("TransactionService.ProcessPayment", req, &resp)
		if err != nil {
			panic("RPC call failed: " + err.Error())
		}
		latencies[i] = time.Since(start)
		client.Close()
	}

	return computeStats(latencies)
}

func computeStats(latencies []time.Duration) Results {
	sort.Slice(latencies, func(i, j int) bool { return latencies[i] < latencies[j] })

	var total time.Duration
	for _, l := range latencies {
		total += l
	}

	return Results{
		Avg: total / time.Duration(len(latencies)),
		P95: latencies[int(math.Ceil(float64(len(latencies))*0.95))-1],
		P99: latencies[int(math.Ceil(float64(len(latencies))*0.99))-1],
		Min: latencies[0],
		Max: latencies[len(latencies)-1],
	}
}

func formatDuration(d time.Duration) string {
	if d < time.Microsecond {
		return strconv.FormatFloat(float64(d.Nanoseconds()), 'f', 0, 64) + "ns"
	}
	if d < time.Millisecond {
		return strconv.FormatFloat(float64(d.Microseconds()), 'f', 1, 64) + "µs"
	}
	return strconv.FormatFloat(float64(d.Microseconds())/1000.0, 'f', 2, 64) + "ms"
}

func main() {
	const requests = 1000

	fmt.Println("=== REST vs RPC Benchmark ===")
	fmt.Printf("Requests per server: %d\n\n", requests)

	fmt.Print("Warming up REST server... ")
	_ = measureREST(10)
	fmt.Println("done")

	fmt.Print("Warming up RPC server... ")
	_ = measureRPC(10)
	fmt.Println("done")

	fmt.Println("\nRunning benchmark...")
	rest := measureREST(requests)
	rpc_ := measureRPC(requests)

	fmt.Println()
	header := fmt.Sprintf("%-12s %12s %12s %12s %12s %12s", "Protocol", "Avg", "P95", "P99", "Min", "Max")
	sep := strings.Repeat("-", len(header))

	fmt.Println(sep)
	fmt.Println(header)
	fmt.Println(sep)
	fmt.Printf("%-12s %12s %12s %12s %12s %12s\n", "REST",
		formatDuration(rest.Avg), formatDuration(rest.P95), formatDuration(rest.P99),
		formatDuration(rest.Min), formatDuration(rest.Max))
	fmt.Printf("%-12s %12s %12s %12s %12s %12s\n", "RPC",
		formatDuration(rpc_.Avg), formatDuration(rpc_.P95), formatDuration(rpc_.P99),
		formatDuration(rpc_.Min), formatDuration(rpc_.Max))
	fmt.Println(sep)

	fmt.Println("\nComparison (RPC vs REST):")
	avgDiff := float64(rpc_.Avg) / float64(rest.Avg)
	p95Diff := float64(rpc_.P95) / float64(rest.P95)
	p99Diff := float64(rpc_.P99) / float64(rest.P99)
	fmt.Printf("  Avg: RPC is %.2fx vs REST\n", avgDiff)
	fmt.Printf("  P95: RPC is %.2fx vs REST\n", p95Diff)
	fmt.Printf("  P99: RPC is %.2fx vs REST\n", p99Diff)

	if avgDiff < 1 {
		fmt.Printf("\n  RPC is %.1f%% faster on average\n", (1-avgDiff)*100)
	} else {
		fmt.Printf("\n  REST is %.1f%% faster on average\n", (1-1/avgDiff)*100)
	}
}
