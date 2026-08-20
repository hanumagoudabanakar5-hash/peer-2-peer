// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract EnergyTrading {
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

    mapping(address => Household) public households;
    Listing[] public listings;

    event Registered(address indexed who, string name);
    event Listed(uint256 indexed id, address indexed seller, uint256 kwh, uint256 pricePerKwh);

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

    function listingCount() external view returns (uint256) {
        return listings.length;
    }
}
