// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

contract Escrow {
    address public immutable USDC;
    address public admin;
    
    // Admin fee percentage (1 = 1%, max 5%)
    uint256 public adminFeePercent = 1;
    uint256 public constant MAX_FEE_PERCENT = 5;
    
    enum EscrowStatus { Pending, Completed, Refunded, Disputed, Resolved, Cancelled }
    
    struct EscrowData {
        uint256 id;
        address buyer;
        address seller;
        uint256 amount;
        uint256 timeout;
        EscrowStatus status;
        bool buyerConfirmed;
        bool disputeRaised;
        address disputeRaiser;
        uint256 createdAt;
    }
    
    mapping(uint256 => EscrowData) public escrows;
    mapping(address => uint256[]) public buyerEscrows;
    mapping(address => uint256[]) public sellerEscrows;
    
    uint256 public nextEscrowId;
    uint256 public totalFeesCollected;
    
    event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount, uint256 timeout);
    event EscrowCompleted(uint256 indexed escrowId, address indexed seller, uint256 amount);
    event EscrowRefunded(uint256 indexed escrowId, address indexed buyer, uint256 amount);
    event DisputeRaised(uint256 indexed escrowId, address indexed raiser);
    event DisputeResolved(uint256 indexed escrowId, address indexed recipient, bool toSeller, uint256 amount, uint256 fee);
    event EscrowCancelled(uint256 indexed escrowId, address indexed canceller);
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    event AdminFeeUpdated(uint256 oldFee, uint256 newFee);
    event AdminFeesWithdrawn(address indexed admin, uint256 amount);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier onlyBuyer(uint256 escrowId) {
        require(escrows[escrowId].buyer == msg.sender, "Only buyer");
        _;
    }
    
    modifier onlyBuyerOrSeller(uint256 escrowId) {
        require(
            escrows[escrowId].buyer == msg.sender || escrows[escrowId].seller == msg.sender,
            "Only buyer or seller"
        );
        _;
    }
    
    constructor(address _usdc) {
        require(_usdc != address(0), "Invalid USDC address");
        USDC = _usdc;
        admin = msg.sender;
    }
    
    /**
     * @notice Create a new escrow
     * @param seller Address of the seller
     * @param amount Amount of USDC to escrow
     * @param timeoutDays Number of days until escrow expires
     */
    function createEscrow(
        address seller,
        uint256 amount,
        uint256 timeoutDays
    ) external returns (uint256) {
        require(seller != address(0), "Invalid seller address");
        require(seller != msg.sender, "Cannot be your own seller");
        require(amount > 0, "Amount must be greater than 0");
        require(timeoutDays > 0 && timeoutDays <= 365, "Timeout must be 1-365 days");
        
        uint256 timeout = block.timestamp + (timeoutDays * 1 days);
        uint256 escrowId = nextEscrowId++;
        
        escrows[escrowId] = EscrowData({
            id: escrowId,
            buyer: msg.sender,
            seller: seller,
            amount: amount,
            timeout: timeout,
            status: EscrowStatus.Pending,
            buyerConfirmed: false,
            disputeRaised: false,
            disputeRaiser: address(0),
            createdAt: block.timestamp
        });
        
        buyerEscrows[msg.sender].push(escrowId);
        sellerEscrows[seller].push(escrowId);
        
        require(
            IERC20(USDC).transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );
        
        emit EscrowCreated(escrowId, msg.sender, seller, amount, timeout);
        
        return escrowId;
    }
    
    /**
     * @notice Buyer confirms job completion and releases funds to seller
     * @param escrowId ID of the escrow
     */
    function confirmCompletion(uint256 escrowId) external onlyBuyer(escrowId) {
        EscrowData storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Pending, "Escrow not pending");
        require(!escrow.disputeRaised, "Dispute in progress");
        
        escrow.status = EscrowStatus.Completed;
        escrow.buyerConfirmed = true;
        
        require(
            IERC20(USDC).transfer(escrow.seller, escrow.amount),
            "USDC transfer failed"
        );
        
        emit EscrowCompleted(escrowId, escrow.seller, escrow.amount);
    }
    
    /**
     * @notice Buyer can refund if timeout has passed
     * @param escrowId ID of the escrow
     */
    function refund(uint256 escrowId) external onlyBuyer(escrowId) {
        EscrowData storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Pending, "Escrow not pending");
        require(block.timestamp >= escrow.timeout, "Timeout not reached");
        require(!escrow.disputeRaised, "Dispute in progress");
        
        escrow.status = EscrowStatus.Refunded;
        
        require(
            IERC20(USDC).transfer(escrow.buyer, escrow.amount),
            "USDC transfer failed"
        );
        
        emit EscrowRefunded(escrowId, escrow.buyer, escrow.amount);
    }
    
    /**
     * @notice Anyone can trigger auto-refund after timeout (helps if buyer forgets)
     * @param escrowId ID of the escrow
     */
    function autoRefund(uint256 escrowId) external {
        EscrowData storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Pending, "Escrow not pending");
        require(block.timestamp >= escrow.timeout, "Timeout not reached");
        require(!escrow.disputeRaised, "Dispute in progress");
        
        escrow.status = EscrowStatus.Refunded;
        
        require(
            IERC20(USDC).transfer(escrow.buyer, escrow.amount),
            "USDC transfer failed"
        );
        
        emit EscrowRefunded(escrowId, escrow.buyer, escrow.amount);
    }
    
    /**
     * @notice Buyer or seller can raise a dispute
     * @param escrowId ID of the escrow
     */
    function raiseDispute(uint256 escrowId) external onlyBuyerOrSeller(escrowId) {
        EscrowData storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Pending, "Escrow not pending");
        require(!escrow.disputeRaised, "Dispute already raised");
        
        escrow.disputeRaised = true;
        escrow.status = EscrowStatus.Disputed;
        escrow.disputeRaiser = msg.sender;
        
        emit DisputeRaised(escrowId, msg.sender);
    }
    
    /**
     * @notice Admin resolves dispute with optional fee
     * @param escrowId ID of the escrow
     * @param toSeller If true, send to seller; if false, refund buyer
     */
    function resolveDispute(uint256 escrowId, bool toSeller) external onlyAdmin {
        EscrowData storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Disputed, "Escrow not disputed");
        
        escrow.status = EscrowStatus.Resolved;
        
        uint256 adminFee = (escrow.amount * adminFeePercent) / 100;
        uint256 finalAmount = escrow.amount - adminFee;
        
        address recipient = toSeller ? escrow.seller : escrow.buyer;
        
        require(
            IERC20(USDC).transfer(recipient, finalAmount),
            "USDC transfer failed"
        );
        
        if (adminFee > 0) {
            totalFeesCollected += adminFee;
        }
        
        emit DisputeResolved(escrowId, recipient, toSeller, finalAmount, adminFee);
    }
    
    /**
     * @notice Admin can force refund in emergency (even without dispute)
     * @param escrowId ID of the escrow
     */
    function adminRefund(uint256 escrowId) external onlyAdmin {
        EscrowData storage escrow = escrows[escrowId];
        require(
            escrow.status == EscrowStatus.Pending || 
            escrow.status == EscrowStatus.Disputed,
            "Invalid status"
        );
        
        escrow.status = EscrowStatus.Refunded;
        
        require(
            IERC20(USDC).transfer(escrow.buyer, escrow.amount),
            "USDC transfer failed"
        );
        
        emit EscrowRefunded(escrowId, escrow.buyer, escrow.amount);
    }
    
    /**
     * @notice Admin can force release to seller in emergency (even without dispute)
     * @param escrowId ID of the escrow
     */
    function adminRelease(uint256 escrowId) external onlyAdmin {
        EscrowData storage escrow = escrows[escrowId];
        require(
            escrow.status == EscrowStatus.Pending || 
            escrow.status == EscrowStatus.Disputed,
            "Invalid status"
        );
        
        escrow.status = EscrowStatus.Completed;
        
        require(
            IERC20(USDC).transfer(escrow.seller, escrow.amount),
            "USDC transfer failed"
        );
        
        emit EscrowCompleted(escrowId, escrow.seller, escrow.amount);
    }
    
    /**
     * @notice Buyer can cancel escrow within 24 hours if seller hasn't acted
     * @param escrowId ID of the escrow
     */
    function cancelEscrow(uint256 escrowId) external onlyBuyer(escrowId) {
        EscrowData storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.Pending, "Escrow not pending");
        require(block.timestamp <= escrow.createdAt + 24 hours, "Cancel period expired");
        require(!escrow.disputeRaised, "Dispute in progress");
        
        escrow.status = EscrowStatus.Cancelled;
        
        require(
            IERC20(USDC).transfer(escrow.buyer, escrow.amount),
            "USDC transfer failed"
        );
        
        emit EscrowCancelled(escrowId, msg.sender);
    }
    
    /**
     * @notice Admin updates fee percentage
     * @param newFeePercent New fee percentage (max 5%)
     */
    function updateAdminFee(uint256 newFeePercent) external onlyAdmin {
        require(newFeePercent <= MAX_FEE_PERCENT, "Fee too high");
        uint256 oldFee = adminFeePercent;
        adminFeePercent = newFeePercent;
        emit AdminFeeUpdated(oldFee, newFeePercent);
    }
    
    /**
     * @notice Admin withdraws collected fees
     */
    function withdrawFees() external onlyAdmin {
        uint256 amount = totalFeesCollected;
        require(amount > 0, "No fees to withdraw");
        
        totalFeesCollected = 0;
        
        require(
            IERC20(USDC).transfer(admin, amount),
            "USDC transfer failed"
        );
        
        emit AdminFeesWithdrawn(admin, amount);
    }
    
    /**
     * @notice Transfer admin role to new address
     * @param newAdmin Address of new admin
     */
    function updateAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminUpdated(oldAdmin, newAdmin);
    }
    
    /**
     * @notice Get escrow details
     */
    function getEscrow(uint256 escrowId) external view returns (EscrowData memory) {
        return escrows[escrowId];
    }
    
    /**
     * @notice Get all escrow IDs for a buyer
     */
    function getBuyerEscrows(address buyer) external view returns (uint256[] memory) {
        return buyerEscrows[buyer];
    }
    
    /**
     * @notice Get all escrow IDs for a seller
     */
    function getSellerEscrows(address seller) external view returns (uint256[] memory) {
        return sellerEscrows[seller];
    }
    
    /**
     * @notice Check if escrow has timed out
     */
    function isTimedOut(uint256 escrowId) external view returns (bool) {
        return block.timestamp >= escrows[escrowId].timeout;
    }
    
    /**
     * @notice Get contract USDC balance
     */
    function getContractBalance() external view returns (uint256) {
        return IERC20(USDC).balanceOf(address(this));
    }
    
    /**
     * @notice Check if escrow can be cancelled by buyer
     */
    function canCancel(uint256 escrowId) external view returns (bool) {
        EscrowData memory escrow = escrows[escrowId];
        return escrow.status == EscrowStatus.Pending && 
               block.timestamp <= escrow.createdAt + 24 hours &&
               !escrow.disputeRaised;
    }
}