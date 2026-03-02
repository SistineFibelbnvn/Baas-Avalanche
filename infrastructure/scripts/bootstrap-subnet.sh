#!/bin/bash
# Bootstrap script for creating and deploying a local Avalanche subnet
# Based on official Avalanche CLI documentation (2024)
# https://docs.avax.network/tooling/avalanche-cli

set -e

SUBNET_NAME="${1:-avxu}"
CHAIN_ID="${2:-9999}"
TOKEN_SYMBOL="${3:-AVXU}"

echo "=== Bắt đầu khởi tạo Subnet $SUBNET_NAME ==="
echo "Chain ID: $CHAIN_ID"
echo "Token Symbol: $TOKEN_SYMBOL"

# Find avalanche CLI
if [ -f "$HOME/bin/avalanche" ]; then
    AVALANCHE_CMD="$HOME/bin/avalanche"
elif command -v avalanche &> /dev/null; then
    AVALANCHE_CMD="avalanche"
else
    echo "Lỗi: Không tìm thấy lệnh 'avalanche'. Vui lòng cài đặt avalanche-cli."
    echo "Xem: https://docs.avax.network/tooling/guides/install-avalanche-cli"
    exit 1
fi

echo "Using avalanche binary: $AVALANCHE_CMD"
$AVALANCHE_CMD --version

# Create blockchain configuration
# Flags based on official docs:
# --evm: Use Subnet-EVM as base template
# --test-defaults: Use default test settings (non-interactive)
# --proof-of-authority: Use PoA for validator management
# --validator-manager-owner: EVM address that controls Validator Manager
# --evm-chain-id: Chain ID for the EVM
# --evm-token: Token symbol
# --latest: Use latest Subnet-EVM version
# --icm: Enable Interchain Messaging
# --force: Overwrite existing config

echo "Đang tạo blockchain configuration..."
$AVALANCHE_CMD blockchain create "$SUBNET_NAME" \
    --evm \
    --test-defaults \
    --proof-of-authority \
    --validator-manager-owner 0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC \
    --evm-chain-id "$CHAIN_ID" \
    --evm-token "$TOKEN_SYMBOL" \
    --latest \
    --icm \
    --force

if [ $? -ne 0 ]; then
    echo "Lỗi: Không thể tạo blockchain. Kiểm tra avalanche-cli version."
    exit 1
fi

# Deploy blockchain to local network
# Flags:
# --local: Deploy to local network
# --ewoq: Use test (ewoq) key for deployment (non-interactive)
# --skip-relayer: Skip relayer deployment for faster setup

echo "Đang deploy blockchain lên mạng Local..."
$AVALANCHE_CMD blockchain deploy "$SUBNET_NAME" \
    --local \
    --ewoq \
    --skip-relayer

if [ $? -ne 0 ]; then
    echo "Lỗi: Không thể deploy blockchain."
    exit 1
fi

echo ""
echo "=== Hoàn tất khởi tạo Subnet $SUBNET_NAME ==="
echo ""
echo "Thông tin RPC:"
$AVALANCHE_CMD blockchain describe "$SUBNET_NAME"
echo ""
echo "Tiếp theo: Chạy backend để quản lý subnet này."
