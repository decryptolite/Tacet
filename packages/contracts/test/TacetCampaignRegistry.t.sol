// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "../src/TacetCampaignRegistry.sol";

contract TacetCampaignRegistryTest is Test {
    TacetCampaignRegistry registry;

    address constant AIRDROP = address(0x000000000000000000000000000000000000A1D0);
    uint40 deadline;

    function setUp() public {
        registry = new TacetCampaignRegistry();
        deadline = uint40(block.timestamp + 30 days);
    }

    // ── happy path ──────────────────────────────────────────────────────────

    function test_register_storesCampaign() public {
        registry.register(AIRDROP, "Q3 OSS rewards", "github.com/foo/bar", deadline);

        TacetCampaignRegistry.Campaign memory c = registry.getCampaign(AIRDROP);
        assertEq(c.maintainer, address(this));
        assertEq(c.title, "Q3 OSS rewards");
        assertEq(c.repoUrl, "github.com/foo/bar");
        assertEq(c.deadline, deadline);
        assertGt(c.createdAt, 0);
    }

    function test_register_emitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit TacetCampaignRegistry.CampaignRegistered(
            AIRDROP, address(this), "Q3 OSS rewards", "github.com/foo/bar", deadline
        );
        registry.register(AIRDROP, "Q3 OSS rewards", "github.com/foo/bar", deadline);
    }

    function test_index_updatesOnRegister() public {
        address a2 = address(0xA2);
        registry.register(AIRDROP, "Campaign 1", "github.com/a/b", deadline);
        registry.register(a2, "Campaign 2", "github.com/c/d", deadline);

        assertEq(registry.campaignCount(), 2);
        address[] memory all = registry.allCampaigns();
        assertEq(all[0], AIRDROP);
        assertEq(all[1], a2);
    }

    // ── reverts ─────────────────────────────────────────────────────────────

    function test_revert_zeroAddress() public {
        vm.expectRevert(TacetCampaignRegistry.ZeroAddress.selector);
        registry.register(address(0), "title", "url", deadline);
    }

    function test_revert_alreadyRegistered() public {
        registry.register(AIRDROP, "title", "url", deadline);
        vm.expectRevert(TacetCampaignRegistry.AlreadyRegistered.selector);
        registry.register(AIRDROP, "title2", "url2", deadline);
    }

    function test_revert_emptyTitle() public {
        vm.expectRevert(TacetCampaignRegistry.EmptyTitle.selector);
        registry.register(AIRDROP, "", "url", deadline);
    }

    function test_revert_deadlineInPast() public {
        vm.expectRevert(TacetCampaignRegistry.DeadlineInPast.selector);
        registry.register(AIRDROP, "title", "url", uint40(block.timestamp - 1));
    }

    // ── getters for unregistered address return zero-value struct ────────────

    function test_getCampaign_unknownAddress_returnsEmpty() public view {
        TacetCampaignRegistry.Campaign memory c = registry.getCampaign(address(0xDEAD));
        assertEq(c.maintainer, address(0));
        assertEq(c.createdAt, 0);
    }
}
