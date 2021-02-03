// SPDX-License-Identifier: MIT

pragma solidity >0.6.1 <0.7.0;

import "./additional/ERC20WithHistory.sol";
import "./additional/Utils.sol";
import "./additional/Registered.sol";


contract NineToken is ERC20WithHistory, Registered, INineToken {
    uint192 maxTotalSupply = 9999 ether;
    uint16 ninePerEthMintPricePercent = 1000;
    address payable leader;

    uint64 public deploymentFundsCollected = 0;

    enum Parameter {
        MAX_TOTAL_SUPPLY, NINE_PER_ETH_MINT_PRICE_PERCENT
    }

    constructor(
        address payable founder,
        address payable _leader
    )
        public
        ERC20WithHistory("Casino 'Honest 99' Token", "NINE")
    {
        leader = leader;
        uint256 founderReward = uint256(maxTotalSupply).mul(Utils.VOTING_THRESHOLD_PERCENT) / 100;

        _mint(founder, founderReward);
    }

    function fundDeployment(address account) external payable {
        uint256 amount = msg.value.mul(100);

        require(totalSupply().add(amount) <= maxTotalSupply, "$NIN1");
        require(msg.value > 0, "$NIN2");
        require(uint256(deploymentFundsCollected).add(msg.value) <= 1 ether, "$NIN4");

        deploymentFundsCollected += uint64(msg.value);

        _mint(account, amount);

        leader.transfer(msg.value);
    }

    function mint(address account) external payable {
        uint256 amount = msg.value.mul(ninePerEthMintPricePercent) / 100;

        require(totalSupply().add(amount) <= maxTotalSupply, "$NIN1");
        require(msg.value > 0, "$NIN2");

        _mint(account, amount);

        payable(registry.getCasino()).transfer(msg.value);
    }

    function getUintParameter(uint8 idx) public override view returns (uint256) {
        Parameter param = Parameter(idx);

        if (param == Parameter.MAX_TOTAL_SUPPLY) {
            return maxTotalSupply;
        }

        if (param == Parameter.NINE_PER_ETH_MINT_PRICE_PERCENT) {
            return ninePerEthMintPricePercent;
        }

        return 0;
    }

    function setUintParameter(uint8 idx, uint256 value) public override onlyByVoting {
        Parameter param = Parameter(idx);

        if (param == Parameter.MAX_TOTAL_SUPPLY) {
            require(value <= 0xffffffffffffffffffffffffffffffffffffffffffffffff, "$NIN5");
            require(value > maxTotalSupply, "$NIN3");

            maxTotalSupply = uint192(value);

        } else if (param == Parameter.NINE_PER_ETH_MINT_PRICE_PERCENT) {
            require(value <= 0xffff, "$NIN6");

            ninePerEthMintPricePercent = uint16(value);
        }
    }

    function getLeader() external override view returns (address) {
        return leader;
    }

    function setLeader(address payable newLeader) external override onlyByVoting {
        leader = newLeader;
    }

    function __initialSetRegistry(IRegistry _registry) external {
        require(address(registry) == Utils.EMPTY_ADDRESS, "$RGD1");
        require(msg.sender == leader, "$RGD4");

        registry = _registry;
    }
}