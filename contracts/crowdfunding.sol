// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/*
Campaign = piggy bank for one project
Factory  = vending machine that makes many campaigns
*/

contract Campaign is ReentrancyGuard {
    address public creator;
    string public metaURI;           // IPFS metadata (title/desc/image)
    uint256 public goal;             // fundraising goal (in wei)
    uint256 public deadline;         // unix timestamp
    uint256 public totalContributed;
    bool public withdrawn;

    mapping(address => uint256) public contributions;

    event Contributed(address indexed from, uint256 amount);
    event Refunded(address indexed to, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyCreator() {
        require(msg.sender == creator, "Not creator");
        _;
    }

    constructor(address _creator, string memory _metaURI, uint256 _goal, uint256 _deadline) {
        require(_goal > 0, "Goal must be > 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");
        creator = _creator;
        metaURI = _metaURI;
        goal = _goal;
        deadline = _deadline;
    }

    // 💰 Contribute ETH
    function contribute() external payable nonReentrant {
        require(block.timestamp < deadline, "Campaign ended");
        require(msg.value > 0, "Need ETH");
        contributions[msg.sender] += msg.value;
        totalContributed += msg.value;
        emit Contributed(msg.sender, msg.value);
    }

    // 🔙 Refund if goal not reached
    function refund() external nonReentrant {
        require(block.timestamp >= deadline, "Not ended yet");
        require(totalContributed < goal, "Goal met");
        uint256 amount = contributions[msg.sender];
        require(amount > 0, "Nothing to refund");
        contributions[msg.sender] = 0;
        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Refund failed");
        emit Refunded(msg.sender, amount);
    }

    // 🏆 Withdraw if goal reached
    function withdraw() external onlyCreator nonReentrant {
        require(block.timestamp >= deadline, "Not ended yet");
        require(totalContributed >= goal, "Goal not met");
        require(!withdrawn, "Already withdrawn");
        withdrawn = true;
        uint256 bal = address(this).balance;
        (bool sent, ) = payable(creator).call{value: bal}("");
        require(sent, "Withdraw failed");
        emit Withdrawn(creator, bal);
    }
}

contract CampaignFactory {
    address[] public campaigns;

    event CampaignCreated(address indexed creator, address campaign, string metaURI, uint256 goal, uint256 deadline);

    function createCampaign(string memory metaURI, uint256 goal, uint256 deadline) external returns (address) {
        Campaign c = new Campaign(msg.sender, metaURI, goal, deadline);
        campaigns.push(address(c));
        emit CampaignCreated(msg.sender, address(c), metaURI, goal, deadline);
        return address(c);
    }

    function allCampaigns() external view returns (address[] memory) {
        return campaigns;
    }
}