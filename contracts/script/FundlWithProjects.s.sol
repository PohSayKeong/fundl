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
        // Define addresses
        address deployer = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        address funder = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;

        // --- Deploy contracts as deployer ---
        vm.startBroadcast(deployer);
        mockToken = new MockERC20("FundlMockToken", "FMT");
        fundl = new Fundl();
        // Mint tokens to deployer and funder
        mockToken.mint(deployer, 1500 ether);
        mockToken.mint(funder, 1500 ether);
        vm.stopBroadcast();

        // --- Create projects as deployer and funder ---
        // Project 1 (deployer)
        vm.startBroadcast(deployer);
        fundl.createProject(
            address(mockToken),
            300 ether,
            block.timestamp + 90 days
        );
        vm.stopBroadcast();

        // Project 2 (deployer)
        vm.startBroadcast(deployer);
        fundl.createProject(
            address(mockToken),
            200 ether,
            block.timestamp + 60 days
        );
        vm.stopBroadcast();

        // Project 3 (funder)
        vm.startBroadcast(funder);
        fundl.createProject(
            address(mockToken),
            100 ether,
            block.timestamp + 120 days
        );
        vm.stopBroadcast();

        // --- Approve and fund projects ---
        // Approve token spending for deployer
        vm.startBroadcast(deployer);
        mockToken.approve(address(fundl), 1500 ether);
        fundl.fundl(0, 100 ether);
        fundl.fundl(1, 50 ether);
        vm.stopBroadcast();

        // Approve and fund project 3 as funder
        vm.startBroadcast(funder);
        mockToken.approve(address(fundl), 1500 ether);
        fundl.fundl(2, 25 ether);
        vm.stopBroadcast();

        // Print summary
        console.log("Fundl deployed at:", address(fundl));
        console.log("Mock Token deployed at:", address(mockToken));
        console.log("Projects created: 3");
        console.log("Projects funded: 3");
    }
}
