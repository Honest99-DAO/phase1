// SPDX-License-Identifier: MIT

pragma solidity >0.6.1 <0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./additional/RegisteredWithCapital.sol";
import "./additional/Utils.sol";
import "./additional/IERC20WithHistory.sol";


contract Accountant is RegisteredWithCapital {
    using SafeMath for uint256;

    DividendsDistributionSession currentDividendsDistributionSession;
    uint64 maintenancePercent = 30;
    uint64 distributionSessionInterval = 7 days;

    enum Parameter {
        MAINTENANCE_PERCENT, DISTRIBUTION_SESSION_INTERVAL
    }

    struct DividendsDistributionSession {
        uint64 startedAt;
        uint192 nineTotalSupply;
        uint256 ethBalance;
        mapping(address => uint64) accountReceivedPaymentAt;
    }

    event DividendsDistributionSessionReset(uint64 startedAt, uint192 nineTotalSupply, uint256 ethBalance);
    event DividendsReceived(uint64 startedAt, address indexed shareholder, uint256 amount);

    constructor() public {
        currentDividendsDistributionSession.startedAt = uint64(block.timestamp);

        emit DividendsDistributionSessionReset(uint64(block.timestamp), 0, 0);
    }

    receive() external payable {
        if (!locked) {
            address payable leader = payable(INineToken(registry.getNineToken()).getLeader());
            leader.transfer(msg.value.mul(maintenancePercent) / 100);
        }
    }

    function receiveDividends(address account) external {
        // if the caller did receive a payout during this payout period - throw
        uint64 sessionStartedAt = currentDividendsDistributionSession.startedAt;
        uint256 sessionEthBalance = currentDividendsDistributionSession.ethBalance;

        require(currentDividendsDistributionSession.accountReceivedPaymentAt[account] < sessionStartedAt, "$ACC1");
        require(sessionEthBalance > 0, "$ACC2");
        require(sessionStartedAt != block.timestamp, "$ACC3");

        // the caller will receive their dividends according to their balance history at the beginning of current payout period
        uint256 accountBalance = IERC20WithHistory(registry.getNineToken()).balanceAt(account, sessionStartedAt);
        uint256 accountShare = sessionEthBalance.mul(uint256(accountBalance)).div(uint256(currentDividendsDistributionSession.nineTotalSupply));

        emit DividendsReceived(sessionStartedAt, account, accountShare);

        // mark the caller and send dividends
        currentDividendsDistributionSession.accountReceivedPaymentAt[account] = sessionStartedAt;
        payable(account).transfer(accountShare);
    }

    function tryResetDividendsDistributionSession() external {
        if (uint256(currentDividendsDistributionSession.startedAt).add(distributionSessionInterval) < block.timestamp) {
            uint192 nineTotalSupply = uint192(IERC20(registry.getNineToken()).totalSupply());

            currentDividendsDistributionSession.startedAt = uint64(block.timestamp);
            currentDividendsDistributionSession.nineTotalSupply = nineTotalSupply;
            currentDividendsDistributionSession.ethBalance = address(this).balance;

            emit DividendsDistributionSessionReset(uint64(block.timestamp), nineTotalSupply, address(this).balance);
        }
    }

    function getUintParameter(uint8 idx) public override view returns (uint256) {
        Parameter param = Parameter(idx);

        if (param == Parameter.MAINTENANCE_PERCENT) {
            return maintenancePercent;
        }

        if (param == Parameter.DISTRIBUTION_SESSION_INTERVAL) {
            return distributionSessionInterval;
        }

        return 0;
    }

    function setUintParameter(uint8 idx, uint256 value) public override onlyByVoting {
        Parameter param = Parameter(idx);

        if (param == Parameter.MAINTENANCE_PERCENT) {
            require(value <= 100, "$ACC4");

            maintenancePercent = uint64(value);
        }

        if (param == Parameter.DISTRIBUTION_SESSION_INTERVAL) {
            require(value <= 365 days && value >= 1 days, "$ACC5");

            distributionSessionInterval = uint64(value);
        }
    }

    function __initialSetRegistry(IRegistry _registry) external {
        require(address(registry) == Utils.EMPTY_ADDRESS, "$RGD1");

        registry = _registry;
    }
}