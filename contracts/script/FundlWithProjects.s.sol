// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {Fundl} from "../src/Fundl.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";

contract FundlWithProjectsScript is Script {
    Fundl public fundl;
    MockERC20 public mockToken;

    function setUp() public {}

    function run() public {
        // Start broadcast to record transactions
        vm.startBroadcast();

        // Deploy the mock token
        mockToken = new MockERC20("FundlMockToken", "FMT");

        // Deploy Fundl contract
        fundl = new Fundl();

        // Mint tokens to deployer and funder
        mockToken.mint(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, 1500 ether);
        mockToken.mint(0x1e527408BFC6Fcaf91a7Fb0c80D11F57E8f171Cb, 1500 ether);

        // Create projects as deployer

        // Approve token spending
        mockToken.approve(address(fundl), 1500 ether);

        // Create Project 1: Ad Infinitum (90 day duration)
        fundl.createProject(
            address(mockToken),
            300 ether, // 300 tokens goal
            block.timestamp + 90 days // ends in 90 days
        );

        // Create Project 2: Hardware Card Wallets (60 day duration)
        fundl.createProject(
            address(mockToken),
            200 ether, // 200 tokens goal
            block.timestamp + 60 days // ends in 60 days
        );

        // Create Project 3: Aetheria (120 day duration)
        fundl.createProject(
            address(mockToken),
            100 ether, // 100 tokens goal
            block.timestamp + 120 days // ends in 120 days
        );

        // Fund Project 1
        fundl.fundl(0, 100 ether);

        // Fund Project 2
        fundl.fundl(1, 50 ether);

        // Fund Project 3
        fundl.fundl(2, 25 ether);

        // Stop broadcast
        vm.stopBroadcast();

        // Print summary
        console.log("Fundl deployed at:", address(fundl));
        console.log("Mock Token deployed at:", address(mockToken));
        console.log("Projects created: 3");
        console.log("Projects funded: 3");
    }
}
