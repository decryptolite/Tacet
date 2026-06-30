// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/TacetCampaignRegistry.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployer = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployer);

        TacetCampaignRegistry registry = new TacetCampaignRegistry();

        vm.stopBroadcast();

        console2.log("TacetCampaignRegistry deployed at:", address(registry));
    }
}
