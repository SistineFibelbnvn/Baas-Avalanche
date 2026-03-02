package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"avxu-bench/pkg/runner"
)

func main() {
	scenario := flag.String("scenario", "transfer", "Scenario to run: transfer, contract, churn")
	duration := flag.Duration("duration", 1*time.Minute, "Duration of the benchmark")
	tps := flag.Int("tps", 10, "Target transactions per second")
	rpcUrl := flag.String("rpc", "http://127.0.0.1:9650/ext/bc/avxu/rpc", "RPC URL of the subnet")
	flag.Parse()

	fmt.Printf("Starting benchmark: %s\n", *scenario)
	fmt.Printf("Duration: %v, Target TPS: %d\n", *duration, *tps)
	fmt.Printf("RPC URL: %s\n", *rpcUrl)

	config := runner.Config{
		Scenario: *scenario,
		Duration: *duration,
		TPS:      *tps,
		RPCUrl:   *rpcUrl,
	}

	r := runner.New(config)
	if err := r.Run(); err != nil {
		log.Fatalf("Benchmark failed: %v", err)
		os.Exit(1)
	}

	fmt.Println("Benchmark completed successfully.")
}
