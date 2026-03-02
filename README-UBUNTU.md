# Hướng dẫn Chạy Avalanche Network trên Ubuntu (WSL)

Vì bạn đang sử dụng Ubuntu, đây là cách tốt nhất để chạy Avalanche Network Runner (ANR).

## 1. Cài đặt các công cụ cần thiết (nếu chưa có)

Mở terminal Ubuntu và chạy:

```bash
# Cập nhật và cài đặt Go (yêu cầu Go 1.20+)
sudo apt update
sudo apt install -y golang-go

# Cài đặt Avalanche Network Runner
go install github.com/ava-labs/avalanche-network-runner@latest

# Thêm Go bin vào PATH (nếu chưa có)
export PATH=$PATH:$(go env GOPATH)/bin
```

## 2. Khởi động Network

Tạo một script tên `start-network.sh` hoặc chạy lệnh sau trực tiếp:

```bash
# Chạy ANR Server mode với log level info
avalanche-network-runner server \
  --log-level info \
  --port=":8080" \
  --grpc-gateway-addr=":8081"
```

Sau khi server chạy, mở một **terminal Ubuntu khác** và chạy lệnh để tạo cluster:

```bash
# Gửi lệnh tạo cluster 5 nodes
avalanche-network-runner control start \
  --log-level info \
  --endpoint="0.0.0.0:8080" \
  --number-of-nodes=5 \
  --avalanche-go-release-tag=v1.11.13
```

## 3. Kết nối Backend

Sau khi mạng chạy:
- Node 1 sẽ chạy ở port ngẫu nhiên hoặc cố định.
- Bạn có thể xem log để biết port RPC của Node 1.
- Nếu muốn cố định port 9650, dùng config file.

### Cách đơn giản hơn: Dùng Avalanche CLI trên Ubuntu

Nếu bạn đã cài `avalanche-cli` trên Ubuntu:

```bash
# Cài đặt (nếu chưa)
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh

# Thêm vào path
export PATH=$HOME/bin:$PATH

# Start mạng local
avalanche network start
```
-> Đây là cách **DỄ NHẤT** và **ỔN ĐỊNH NHẤT** trên Ubuntu. Nó sẽ tự động chạy 5 nodes và expose port 9650.

## 4. Kiểm tra

Sau khi chạy `avalanche network start`:
```bash
curl -X POST --data '{"jsonrpc":"2.0","method":"info.getNodeVersion","params":{},"id":1}' -H 'content-type:application/json' 127.0.0.1:9650/ext/info
```
Nếu trả về JSON, mạng đã sẵn sàng! Backend Windows của bạn sẽ kết nối được tới `127.0.0.1:9650`.
