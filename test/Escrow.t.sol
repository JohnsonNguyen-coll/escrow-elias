// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/Escrow.sol";

// Mock USDC token for testing
contract MockUSDC is IERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function decimals() external view override returns (uint8) {
        return 6;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }
}

contract EscrowTest is Test {
    Escrow escrow;
    MockUSDC usdc;
    
    address buyer = address(1);
    address seller = address(2);
    address admin = address(3);
    
    function setUp() public {
        usdc = new MockUSDC();
        vm.prank(admin);
        escrow = new Escrow(address(usdc));
        
        // Mint USDC to buyer
        usdc.mint(buyer, 1000e6);
    }
    
    function testCreateEscrow() public {
        vm.prank(buyer);
        usdc.approve(address(escrow), 100e6);
        
        vm.prank(buyer);
        uint256 escrowId = escrow.createEscrow(seller, 100e6, block.timestamp + 7 days);
        
        Escrow.EscrowData memory data = escrow.getEscrow(escrowId);
        assertEq(data.buyer, buyer);
        assertEq(data.seller, seller);
        assertEq(data.amount, 100e6);
        assertEq(uint256(data.status), uint256(Escrow.EscrowStatus.Pending));
    }
    
    function testConfirmCompletion() public {
        vm.prank(buyer);
        usdc.approve(address(escrow), 100e6);
        
        vm.prank(buyer);
        uint256 escrowId = escrow.createEscrow(seller, 100e6, block.timestamp + 7 days);
        
        uint256 sellerBalanceBefore = usdc.balanceOf(seller);
        
        vm.prank(buyer);
        escrow.confirmCompletion(escrowId);
        
        uint256 sellerBalanceAfter = usdc.balanceOf(seller);
        assertEq(sellerBalanceAfter - sellerBalanceBefore, 100e6);
        
        Escrow.EscrowData memory data = escrow.getEscrow(escrowId);
        assertEq(uint256(data.status), uint256(Escrow.EscrowStatus.Completed));
    }
    
    function testRefund() public {
        vm.prank(buyer);
        usdc.approve(address(escrow), 100e6);
        
        vm.prank(buyer);
        uint256 escrowId = escrow.createEscrow(seller, 100e6, block.timestamp + 1 days);
        
        // Fast forward time
        vm.warp(block.timestamp + 2 days);
        
        uint256 buyerBalanceBefore = usdc.balanceOf(buyer);
        
        vm.prank(buyer);
        escrow.refund(escrowId);
        
        uint256 buyerBalanceAfter = usdc.balanceOf(buyer);
        assertEq(buyerBalanceAfter - buyerBalanceBefore, 100e6);
        
        Escrow.EscrowData memory data = escrow.getEscrow(escrowId);
        assertEq(uint256(data.status), uint256(Escrow.EscrowStatus.Refunded));
    }
    
    function testRaiseDispute() public {
        vm.prank(buyer);
        usdc.approve(address(escrow), 100e6);
        
        vm.prank(buyer);
        uint256 escrowId = escrow.createEscrow(seller, 100e6, block.timestamp + 7 days);
        
        vm.prank(seller);
        escrow.raiseDispute(escrowId);
        
        Escrow.EscrowData memory data = escrow.getEscrow(escrowId);
        assertEq(uint256(data.status), uint256(Escrow.EscrowStatus.Disputed));
        assertTrue(data.disputeRaised);
    }
}

