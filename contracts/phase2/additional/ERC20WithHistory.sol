// SPDX-License-Identifier: MIT

pragma solidity >0.6.1 <0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Utils.sol";
import "./IERC20WithHistory.sol";


/**
 * @dev A token that holds a history of any of it's moves
*/
contract ERC20WithHistory is ERC20, IERC20WithHistory {

    struct BalanceSnapshot {
        uint64 timestamp;
        uint192 balance;
    }

    /**
     * @dev Each account has a history of how it's balance changed over time
    */
    mapping(address => BalanceSnapshot[]) balanceSnapshots;

    constructor(string memory name_, string memory symbol_) public ERC20(name_, symbol_) {}

    /**
     * @dev This function returns a balance of the account at any moment of history
    */
    function balanceAt(address account, uint64 timestamp) external override view returns (uint192) {
        BalanceSnapshot[] storage accountHistory = balanceSnapshots[account];

        // if the timestamp is earlier than the first balance snapshot - it's balance is 0
        // or if there is no history for account - it's balance is 0
        uint256 historyLength = accountHistory.length;
        if (historyLength == 0 || timestamp < accountHistory[0].timestamp) {
            return 0;
        }

        uint256 lastIndex = historyLength - 1;
        // if the timestamp is more recent than the last balance snapshot - it's balance is the last balance
        if (timestamp >= accountHistory[lastIndex].timestamp) {
            return accountHistory[lastIndex].balance;
        }

        // otherwise - binary search based lookup
        uint256 snapshotIdx = balanceSnapshotLookup(accountHistory, 0, lastIndex, timestamp);
        return accountHistory[snapshotIdx].balance;
    }

    /**
    * @dev This function helps the user save some fee money, when they call some other function that
    * invokes balanceOf(account, timestamp). By calling this function the user deletes their history except the most
    * recent entry. The user should understand that after invoking that function, they are no longer able to prove their
    * balance history.
    */
    function clearAccountHistory() external override {
        BalanceSnapshot[] storage accountHistory = balanceSnapshots[_msgSender()];
        uint256 historyLength = accountHistory.length;

        // if the callers history is empty or contains only one snapshot - return
        if (historyLength < 2) {
            return;
        }

        // otherwise delete callers history except the most recent snapshot
        BalanceSnapshot memory recentSnapshot = accountHistory[historyLength - 1];

        delete balanceSnapshots[_msgSender()];

        accountHistory.push(recentSnapshot);
    }

    // called on every transfer by _beforeTokenTransfer()
    function updateAccountHistory(address account, uint192 accountBalance) internal {
        BalanceSnapshot[] storage accountHistory = balanceSnapshots[account];

        // if history is empty - just add new entry
        uint256 historyLength = accountHistory.length;
        if (historyLength == 0) {
            accountHistory.push(BalanceSnapshot(uint64(block.timestamp), accountBalance));

        } else  {
            BalanceSnapshot storage lastSnapshot = accountHistory[historyLength - 1];

            if (lastSnapshot.timestamp == uint64(block.timestamp)) {
                // if there are multiple updates during one block - only save the most recent balance per block
                lastSnapshot.balance = accountBalance;
            } else {
                // otherwise just add new balance snapshot
                accountHistory.push(BalanceSnapshot(uint64(block.timestamp), accountBalance));
            }
        }
    }

    // Uses binary search to find the closest to timestamp balance snapshot
    function balanceSnapshotLookup(
        BalanceSnapshot[] storage accountHistory,
        uint256 begin,
        uint256 end,
        uint64 timestamp
    ) internal view returns (uint256) {
        // split in half
        uint256 midLeft = begin.add((end - begin) / 2);
        uint256 midRight = midLeft + 1;

        uint64 leftTimestamp = accountHistory[midLeft].timestamp;
        uint64 rightTimestamp = accountHistory[midRight].timestamp;

        // if we're in between (left is lower, right is higher) or if we found exact value - return its index
        if ((leftTimestamp <= timestamp && rightTimestamp > timestamp)) {
            return midLeft;
        }
        if (rightTimestamp == timestamp) {
            return midRight;
        }

        // if we're higher than both left and right, repeat for the left side
        if (leftTimestamp < timestamp && rightTimestamp < timestamp) {
            return balanceSnapshotLookup(accountHistory, midRight, end, timestamp);
        }

        // if we're lower than both left and right, repeat for the right side
        if (leftTimestamp > timestamp && rightTimestamp > timestamp) {
            return balanceSnapshotLookup(accountHistory, begin, midLeft, timestamp);
        }

        // it is impossible, because we checked boundaries before
        assert(false);
        return Utils.MAX_UINT;
    }

    /**
     * Using openzeppelins hook to update history on every change
    */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override virtual {
        if (from != Utils.EMPTY_ADDRESS) {
            updateAccountHistory(from, uint192(balanceOf(from) - amount));
        }

        if (to != Utils.EMPTY_ADDRESS) {
            updateAccountHistory(to, uint192(balanceOf(to) + amount));
        }

        super._beforeTokenTransfer(from, to, amount);
    }
}