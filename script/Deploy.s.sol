// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {Escrow} from "../src/Escrow.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        Escrow escrow = new Escrow(usdcAddress);
        
        console.log("Escrow deployed at:", address(escrow));
        console.log("USDC address:", usdcAddress);
        console.log("Admin address:", escrow.admin());
        
        vm.stopBroadcast();
    }
}

