#!/bin/bash
# Script to ensure Avalanche Network is running before starting backend

echo "Checking Avalanche Network status..."

# Check if network is responding
if curl -s -X POST --data '{"jsonrpc":"2.0","id":1,"method":"info.getNodeVersion"}' -H 'content-type:application/json' http://127.0.0.1:9650/ext/info > /dev/null 2>&1; then
    echo "✓ Avalanche Network is already running"
else
    echo "Starting Avalanche Network..."
    /home/huynguyen/bin/avalanche network start
    
    # Wait for network to be ready
    echo "Waiting for network to be ready..."
    for i in {1..30}; do
        if curl -s -X POST --data '{"jsonrpc":"2.0","id":1,"method":"info.getNodeVersion"}' -H 'content-type:application/json' http://127.0.0.1:9650/ext/info > /dev/null 2>&1; then
            echo "✓ Avalanche Network is ready!"
            break
        fi
        sleep 1
    done
fi

echo "Network check complete."
