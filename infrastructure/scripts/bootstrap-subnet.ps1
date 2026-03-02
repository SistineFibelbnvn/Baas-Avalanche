# Bootstrap script for creating and deploying a local Avalanche subnet (Windows/PowerShell)
# Based on official Avalanche CLI documentation (2024)
# https://docs.avax.network/tooling/avalanche-cli
# 
# NOTE: Avalanche CLI is designed for Linux/macOS. On Windows, use WSL.
# This script calls WSL to run the CLI commands.

param (
    [string]$SubnetName = "avxu",
    [string]$ChainId = "9999",
    [string]$TokenSymbol = "AVXU",
    [string]$WslDistro = "Ubuntu-22.04"
)

Write-Host "=== Bắt đầu khởi tạo Subnet $SubnetName ===" -ForegroundColor Cyan
Write-Host "Chain ID: $ChainId"
Write-Host "Token Symbol: $TokenSymbol"
Write-Host "WSL Distro: $WslDistro"

# Check if WSL is available
if (-not (Get-Command "wsl" -ErrorAction SilentlyContinue)) {
    Write-Error "WSL không được cài đặt. Avalanche CLI yêu cầu Linux/WSL."
    exit 1
}

# Check avalanche CLI in WSL
$VersionCheck = wsl -d $WslDistro -- bash -c "avalanche --version 2>/dev/null || echo 'NOT_FOUND'"
if ($VersionCheck -match "NOT_FOUND") {
    Write-Error "Không tìm thấy 'avalanche' trong WSL. Vui lòng cài đặt avalanche-cli trong WSL."
    Write-Host "Xem: https://docs.avax.network/tooling/guides/install-avalanche-cli"
    exit 1
}
Write-Host "Avalanche CLI Version: $VersionCheck"

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

Write-Host "Đang tạo blockchain configuration..." -ForegroundColor Yellow
$CreateCmd = @"
avalanche blockchain create $SubnetName --evm --test-defaults --proof-of-authority --validator-manager-owner 0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC --evm-chain-id $ChainId --evm-token $TokenSymbol --latest --icm --force
"@

wsl -d $WslDistro -- bash -c $CreateCmd

if ($LASTEXITCODE -ne 0) {
    Write-Error "Lỗi khi tạo blockchain."
    exit $LASTEXITCODE
}

# Deploy blockchain to local network
# Flags:
# --local: Deploy to local network
# --ewoq: Use test (ewoq) key for deployment (non-interactive)
# --skip-relayer: Skip relayer deployment for faster setup

Write-Host "Đang deploy blockchain lên mạng Local..." -ForegroundColor Yellow
$DeployCmd = "avalanche blockchain deploy $SubnetName --local --ewoq --skip-relayer"

wsl -d $WslDistro -- bash -c $DeployCmd

if ($LASTEXITCODE -ne 0) {
    Write-Error "Lỗi khi deploy blockchain."
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "=== Hoàn tất khởi tạo Subnet $SubnetName ===" -ForegroundColor Green
Write-Host ""

# Show subnet info
Write-Host "Thông tin RPC:" -ForegroundColor Cyan
wsl -d $WslDistro -- bash -c "avalanche blockchain describe $SubnetName"

Write-Host ""
Write-Host "Tiếp theo: Chạy backend để quản lý subnet này."
