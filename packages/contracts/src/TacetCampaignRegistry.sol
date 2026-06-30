// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @title TacetCampaignRegistry
 * @notice Lightweight metadata store for Tacet campaigns.
 *
 * Deployment: the TokenOps ConfidentialAirdropFactory creates the confidential
 * airdrop contract (FHE handling, claims, ACL). This registry binds a human
 * label and GitHub repo to that address so the claim page can resolve metadata
 * from the airdrop address alone.
 *
 * Immutable after registration — no updates, no admin key.
 */
contract TacetCampaignRegistry {
    struct Campaign {
        address maintainer;
        string title;
        string repoUrl;
        uint40 deadline;
        uint40 createdAt;
    }

    /// airdropAddress → Campaign
    mapping(address => Campaign) private _campaigns;

    /// Ordered list of registered airdrop addresses (for iteration).
    address[] private _index;

    event CampaignRegistered(
        address indexed airdropAddress,
        address indexed maintainer,
        string title,
        string repoUrl,
        uint40 deadline
    );

    error AlreadyRegistered();
    error ZeroAddress();
    error EmptyTitle();
    error DeadlineInPast();

    /**
     * @notice Register a deployed TokenOps ConfidentialAirdrop contract.
     * @param airdropAddress The address returned by ConfidentialAirdropFactory.
     * @param title          Human-readable campaign name (≤ 64 chars enforced off-chain).
     * @param repoUrl        GitHub repo URL for context in the claim UI.
     * @param deadline       Unix timestamp after which claims are locked.
     */
    function register(
        address airdropAddress,
        string calldata title,
        string calldata repoUrl,
        uint40 deadline
    ) external {
        if (airdropAddress == address(0)) revert ZeroAddress();
        if (_campaigns[airdropAddress].createdAt != 0) revert AlreadyRegistered();
        if (bytes(title).length == 0) revert EmptyTitle();
        if (deadline <= block.timestamp) revert DeadlineInPast();

        _campaigns[airdropAddress] = Campaign({
            maintainer: msg.sender,
            title: title,
            repoUrl: repoUrl,
            deadline: deadline,
            createdAt: uint40(block.timestamp)
        });
        _index.push(airdropAddress);

        emit CampaignRegistered(airdropAddress, msg.sender, title, repoUrl, deadline);
    }

    /// @notice Fetch metadata for a registered campaign. Reverts with zero-value struct for unknown addresses.
    function getCampaign(address airdropAddress) external view returns (Campaign memory) {
        return _campaigns[airdropAddress];
    }

    /// @notice Returns all registered airdrop addresses in registration order.
    function allCampaigns() external view returns (address[] memory) {
        return _index;
    }

    /// @notice Total number of registered campaigns.
    function campaignCount() external view returns (uint256) {
        return _index.length;
    }
}
