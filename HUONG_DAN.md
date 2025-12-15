# Hướng Dẫn Sử Dụng Escrow USDC DApp

## 📋 Tổng Quan

Dự án này là một ứng dụng DApp Escrow USDC được xây dựng trên Arc Testnet, cho phép:
- **Buyer** (người mua) tạo escrow và gửi USDC
- **Seller** (người bán) nhận tiền khi buyer xác nhận hoàn thành
- **Admin** giải quyết tranh chấp khi có dispute

## 🏗️ Cấu Trúc Dự Án

```
escrow-contract/
├── src/
│   └── Escrow.sol          # Smart contract chính
├── test/
│   └── Escrow.t.sol        # Tests cho contract
├── script/
│   └── Deploy.s.sol        # Script deploy
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Các component UI
│   │   ├── config/        # Cấu hình wagmi, contract
│   │   └── App.jsx        # Component chính
│   └── package.json
├── foundry.toml           # Cấu hình Foundry
└── README.md              # Tài liệu chính
```

## 🚀 Các Bước Triển Khai

### 1. Cài Đặt Môi Trường

**Cài đặt Foundry:**
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

**Cài đặt Node.js dependencies (cho frontend):**
```bash
cd frontend
npm install
```

### 2. Cấu Hình

**Tạo file `.env` trong thư mục gốc:**
```env
ARC_TESTNET_RPC_URL="https://rpc.testnet.arc.network"
PRIVATE_KEY="0x..." # Private key của bạn
USDC_ADDRESS="0x..." # Địa chỉ USDC contract trên Arc Testnet
```

**Tạo file `frontend/.env`:**
```env
VITE_ESCROW_CONTRACT_ADDRESS="0x..." # Sẽ cập nhật sau khi deploy
VITE_ARC_RPC_URL="https://rpc.testnet.arc.network"
```

### 3. Deploy Smart Contract

```bash
# Compile contract
forge build

# Chạy tests
forge test

# Deploy lên Arc Testnet
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $ARC_TESTNET_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

Sau khi deploy thành công, copy địa chỉ contract và cập nhật vào `frontend/.env`.

### 4. Chạy Frontend

```bash
cd frontend
npm run dev
```

Ứng dụng sẽ mở tại `http://localhost:3000`

## 💼 Các Chức Năng Chính

### Cho Buyer (Người Mua)

1. **Tạo Escrow:**
   - Nhập địa chỉ seller
   - Nhập số tiền USDC
   - Chọn thời gian timeout (số ngày)
   - Approve USDC (lần đầu tiên)
   - Tạo escrow

2. **Xác Nhận Hoàn Thành:**
   - Khi công việc đã hoàn thành
   - Click "Confirm Completion"
   - USDC sẽ được chuyển cho seller

3. **Hoàn Tiền:**
   - Nếu quá thời hạn (timeout)
   - Click "Refund"
   - USDC sẽ được trả lại cho buyer

4. **Raise Dispute:**
   - Nếu có vấn đề
   - Click "Raise Dispute"
   - Admin sẽ xử lý

### Cho Seller (Người Bán)

1. **Xem Escrows:**
   - Xem tất cả escrows mà bạn là seller
   - Theo dõi trạng thái

2. **Raise Dispute:**
   - Nếu buyer không confirm
   - Có thể raise dispute
   - Admin sẽ xử lý

### Cho Admin

1. **Admin Panel:**
   - Chỉ admin mới có quyền truy cập
   - Xem tất cả disputes
   - Resolve dispute:
     - Pay Seller: Trả tiền cho seller
     - Refund Buyer: Hoàn tiền cho buyer

## 🔧 Cấu Hình MetaMask

Để sử dụng DApp, bạn cần thêm Arc Testnet vào MetaMask:

1. Mở MetaMask
2. Settings → Networks → Add Network
3. Thông tin network:
   - **Network Name:** Arc Testnet
   - **RPC URL:** https://rpc.testnet.arc.network
   - **Chain ID:** 5042002
   - **Currency Symbol:** USDC
   - **Block Explorer:** https://testnet.arcscan.app

## 💰 Lấy Testnet USDC

1. Truy cập: https://faucet.circle.com
2. Chọn **Arc Testnet**
3. Nhập địa chỉ ví của bạn
4. Request testnet USDC

## 📱 Sử Dụng DApp

### Bước 1: Kết Nối Ví
- Click "Connect Wallet" trên giao diện
- Chọn MetaMask hoặc ví khác
- Xác nhận kết nối

### Bước 2: Tạo Escrow
1. Chuyển sang tab "Create Escrow"
2. Nhập thông tin:
   - Seller address
   - Amount (USDC)
   - Timeout (days)
3. Click "Approve USDC" (nếu chưa approve)
4. Click "Create Escrow"

### Bước 3: Quản Lý Escrows
- Tab "My Escrows" hiển thị tất cả escrows của bạn
- Với mỗi escrow, bạn có thể:
  - **Confirm Completion** (nếu là buyer)
  - **Refund** (nếu đã timeout)
  - **Raise Dispute** (nếu có vấn đề)

### Bước 4: Admin Panel
- Chỉ admin mới thấy tab này
- Xem và resolve disputes

## ⚠️ Lưu Ý Quan Trọng

1. **Bảo Mật:**
   - KHÔNG BAO GIỜ commit file `.env` lên git
   - Giữ private key an toàn
   - Chỉ dùng testnet, không dùng mainnet private key

2. **USDC Address:**
   - Cần tìm địa chỉ USDC contract trên Arc Testnet
   - Kiểm tra Arc documentation hoặc Discord
   - Có thể cần deploy mock USDC cho testnet

3. **Arc Testnet:**
   - Đang trong giai đoạn testnet
   - Có thể không ổn định
   - Testnet tokens không có giá trị thật

## 🐛 Troubleshooting

### Contract không deploy được
- Kiểm tra PRIVATE_KEY trong `.env`
- Kiểm tra USDC_ADDRESS có đúng không
- Đảm bảo ví có đủ USDC để trả gas

### Frontend không kết nối được
- Kiểm tra VITE_ESCROW_CONTRACT_ADDRESS trong `frontend/.env`
- Kiểm tra MetaMask đã kết nối Arc Testnet chưa
- Mở console browser để xem lỗi

### Không tìm thấy USDC address
- Kiểm tra Arc documentation
- Hỏi trên Arc Discord
- Có thể cần deploy mock USDC contract

## 📚 Tài Liệu Tham Khảo

- [Arc Network Docs](https://docs.arc.network)
- [Foundry Documentation](https://book.getfoundry.sh)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)

## 🎯 Tính Năng Đã Hoàn Thành

✅ Smart contract Escrow với đầy đủ chức năng
✅ Frontend React với UI đẹp, responsive
✅ Wallet connection (MetaMask)
✅ Create Escrow
✅ View Escrows
✅ Confirm Completion
✅ Refund (timeout)
✅ Raise Dispute
✅ Admin Panel cho dispute resolution
✅ Tests cho smart contract
✅ Documentation đầy đủ

## 🚧 Có Thể Cải Thiện

- Thêm event listeners để tự động refresh escrows
- Thêm pagination cho danh sách escrows
- Thêm filter/search escrows
- Thêm notifications khi có events
- Cải thiện admin panel để fetch disputes từ events
- Thêm multi-sig cho admin
- Thêm escrow templates

