# Quick Start Guide

## Bước 1: Cài đặt Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Bước 2: Cấu hình môi trường

Tạo file `.env` trong thư mục gốc:

```bash
ARC_TESTNET_RPC_URL="https://rpc.testnet.arc.network"
PRIVATE_KEY="0x..." # Private key của bạn
USDC_ADDRESS="0x..." # Địa chỉ USDC contract trên Arc Testnet
```

**Lưu ý**: Bạn cần tìm địa chỉ USDC contract trên Arc Testnet. Kiểm tra:
- Arc documentation
- Arc block explorer
- Arc Discord community

## Bước 3: Deploy Contract

```bash
# Compile
forge build

# Test
forge test

# Deploy
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

Sau khi deploy, copy địa chỉ contract và cập nhật vào `frontend/.env`.

## Bước 4: Setup Frontend

```bash
cd frontend

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Cập nhật .env với:
# VITE_ESCROW_CONTRACT_ADDRESS="0x..." # Địa chỉ contract vừa deploy
# VITE_ARC_RPC_URL="https://rpc.testnet.arc.network"
```

## Bước 5: Chạy Frontend

```bash
npm run dev
```

Ứng dụng sẽ mở tại `http://localhost:3000`

## Bước 6: Kết nối MetaMask với Arc Testnet

1. Mở MetaMask
2. Thêm network mới:
   - Network Name: Arc Testnet
   - RPC URL: https://rpc.testnet.arc.network
   - Chain ID: 5042002
   - Currency Symbol: USDC
   - Block Explorer: https://testnet.arcscan.app

3. Lấy testnet USDC:
   - Truy cập https://faucet.circle.com
   - Chọn Arc Testnet
   - Nhập địa chỉ ví và request USDC

## Bước 7: Sử dụng DApp

1. Kết nối ví MetaMask
2. Tạo escrow mới:
   - Nhập địa chỉ seller
   - Nhập số tiền USDC
   - Chọn thời gian timeout (ngày)
   - Approve USDC (lần đầu)
   - Tạo escrow

3. Quản lý escrows:
   - Xem danh sách escrows của bạn
   - Confirm completion (nếu là buyer)
   - Refund (nếu đã timeout)
   - Raise dispute (nếu cần)

4. Admin panel:
   - Chỉ admin mới có quyền truy cập
   - Resolve disputes

## Troubleshooting

### Contract không deploy được
- Kiểm tra PRIVATE_KEY trong .env
- Kiểm tra USDC_ADDRESS có đúng không
- Đảm bảo ví có đủ USDC để trả gas

### Frontend không kết nối được
- Kiểm tra VITE_ESCROW_CONTRACT_ADDRESS trong frontend/.env
- Kiểm tra MetaMask đã kết nối Arc Testnet chưa
- Kiểm tra console browser để xem lỗi

### Không tìm thấy USDC address
- Kiểm tra Arc documentation
- Hỏi trên Arc Discord
- Có thể cần deploy mock USDC contract cho testnet

## Lưu ý quan trọng

⚠️ **KHÔNG BAO GIỜ** commit file `.env` lên git
⚠️ Giữ private key an toàn
⚠️ Arc đang ở testnet, có thể không ổn định
⚠️ Testnet tokens không có giá trị thật

