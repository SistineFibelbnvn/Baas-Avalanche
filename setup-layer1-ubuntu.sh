#!/bin/bash

# AVXU Layer1 Setup Script for Ubuntu/WSL
# Run this script to setup your environment:
# bash setup-layer1-ubuntu.sh

set -e

echo "============================================"
echo "   AVXU Layer1 Environment Setup (Ubuntu)"
echo "============================================"
echo ""

# 1. Update and install dependencies
echo "[1/4] Checking dependencies..."
sudo apt update
sudo apt install -y curl wget git build-essential

# 2. Install Go (if not found)
if ! command -v go &> /dev/null; then
    echo "[2/4] Installing Go..."
    # Install Go via apt (easiest way, version usually ok for dev)
    sudo apt install -y golang-go
    
    # Add to path if needed
    if [[ ":$PATH:" != *":$HOME/go/bin:"* ]]; then
        echo 'export PATH=$PATH:$HOME/go/bin' >> ~/.bashrc
        source ~/.bashrc
    fi
else
    echo "✔ Go is already installed: $(go version)"
fi

# 3. Install Avalanche CLI
if ! command -v avalanche &> /dev/null; then
    echo "[3/4] Installing Avalanche CLI..."
    curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh
    
    # Add bin to path if needed (install script usually puts it in ~/bin)
    if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
        echo 'export PATH=$HOME/bin:$PATH' >> ~/.bashrc
        export PATH=$HOME/bin:$PATH
    fi
    echo "✔ Avalanche CLI installed!"
else
    echo "✔ Avalanche CLI is already installed"
fi

# 4. Start Local Network
echo ""
echo "[4/4] Starting Avalanche Local Network..."
echo "Running: avalanche network start"
echo ""

# Check if network is already running
if curl -s http://127.0.0.1:9650/ext/health > /dev/null; then
    echo "✔ Network is ALREADY RUNNING at 127.0.0.1:9650"
else
    avalanche network start
    echo "✔ Network started successfully!"
fi

echo ""
echo "============================================"
echo "   Setup Complete!"
echo "============================================"
echo "Your local Avalanche network is running."
echo "You can now return to Windows and use the platform."
echo ""
echo "Note: Keep this terminal open or run 'avalanche network start' whenever you restart."
