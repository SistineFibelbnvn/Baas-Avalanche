package runner

import (
	"fmt"
	"time"
)

type Config struct {
	Scenario string
	Duration time.Duration
	TPS      int
	RPCUrl   string
}

type Runner struct {
	config Config
}

func New(config Config) *Runner {
	return &Runner{config: config}
}

func (r *Runner) Run() error {
	ticker := time.NewTicker(time.Second / time.Duration(r.config.TPS))
	defer ticker.Stop()

	timeout := time.After(r.config.Duration)
	count := 0

	fmt.Println("Running...")

	for {
		select {
		case <-timeout:
			fmt.Printf("Finished. Total transactions sent: %d\n", count)
			return nil
		case <-ticker.C:
			// Simulate transaction sending
			if err := r.sendTx(); err != nil {
				fmt.Printf("Error sending tx: %v\n", err)
			}
			count++
			if count%10 == 0 {
				fmt.Printf("Sent %d txs...\r", count)
			}
		}
	}
}

func (r *Runner) sendTx() error {
	// Placeholder for actual EVM transaction logic
	// In a real implementation, we would use go-ethereum/ethclient here
	return nil
}
