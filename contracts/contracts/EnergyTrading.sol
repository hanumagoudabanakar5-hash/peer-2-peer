// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract EnergyTrading {
    address public oracle;  // trusted source that confirms real-world delivery

    struct Household {
        bool registered;
        string name;
    }

    struct Listing {
        address seller;
        uint256 kwh;
        uint256 pricePerKwh;
        bool active;
    }

    struct Trade {
        uint256 listingId;
        address buyer;
        address seller;
        uint256 kwh;
        uint256 amountPaid;  // held in escrow by this contract
        bool delivered;
        bool settled;
    }

    mapping(address => Household) public households;
    Listing[] public listings;
    Trade[] public trades;

    event Registered(address indexed who, string name);
    event Listed(uint256 indexed id, address indexed seller, uint256 kwh, uint256 pricePerKwh);
    event Purchased(uint256 indexed tradeId, address indexed buyer, uint256 kwh, uint256 amount);
    event Delivered(uint256 indexed tradeId);
    event Settled(uint256 indexed tradeId, address indexed seller, uint256 amount);

    constructor() {
        oracle = msg.sender;  // deployer acts as the oracle for the prototype
    }

    function register(string calldata name) external {
        require(!households[msg.sender].registered, "Already registered");
        households[msg.sender] = Household(true, name);
        emit Registered(msg.sender, name);
    }

    function listSurplus(uint256 kwh, uint256 pricePerKwh) external {
        require(households[msg.sender].registered, "Register first");
        require(kwh > 0, "Must offer some energy");
        listings.push(Listing(msg.sender, kwh, pricePerKwh, true));
        emit Listed(listings.length - 1, msg.sender, kwh, pricePerKwh);
    }

    // Buyer pays into escrow. Money is held by the contract, NOT sent to seller yet.
    function buyEnergy(uint256 listingId) external payable {
        require(households[msg.sender].registered, "Register first");
        Listing storage lst = listings[listingId];
        require(lst.active, "Listing not active");
        uint256 cost = lst.kwh * lst.pricePerKwh;
        require(msg.value == cost, "Send exact payment");
        require(msg.sender != lst.seller, "Cannot buy own listing");

        lst.active = false;  // reserve this listing
        trades.push(Trade(listingId, msg.sender, lst.seller, lst.kwh, msg.value, false, false));
        emit Purchased(trades.length - 1, msg.sender, lst.kwh, msg.value);
    }

    // ORACLE HOOK: confirms real-world energy delivery, then releases escrow to seller.
    // In production, your Python oracle (fed by smart meters) calls this.
    function confirmDelivery(uint256 tradeId) external {
        require(msg.sender == oracle, "Only oracle can confirm");
        Trade storage t = trades[tradeId];
        require(!t.settled, "Already settled");

        t.delivered = true;
        t.settled = true;
        emit Delivered(tradeId);

        (bool ok, ) = t.seller.call{value: t.amountPaid}("");
        require(ok, "Payment to seller failed");
        emit Settled(tradeId, t.seller, t.amountPaid);
    }

    function listingCount() external view returns (uint256) {
        return listings.length;
    }

    function tradeCount() external view returns (uint256) {
        return trades.length;
    }
}
