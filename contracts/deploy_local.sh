#!/bin/bash
# Script to start Anvil and deploy FundlWithProjects contract

# Start Anvil in the background
# Start Anvil in the background and show logs directly
anvil &
ANVIL_PID=$!
echo "Anvil started with PID $ANVIL_PID"

# Wait for Anvil to be ready
sleep 3

# Run the Forge script to deploy FundlWithProjects
forge script script/FundlWithProjects.s.sol:FundlWithProjectsScript --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast

echo -e "\nDeployment complete. Showing Anvil logs. Press Ctrl+C to exit and stop Anvil.\n"

# Bring Anvil logs to foreground (Ctrl+C to exit)
trap 'kill $ANVIL_PID; echo "\nAnvil stopped."; exit 0' SIGINT
wait $ANVIL_PID
