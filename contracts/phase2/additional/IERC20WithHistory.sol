// SPDX-License-Identifier: MIT

pragma solidity >0.6.1 <0.7.0;


interface IERC20WithHistory {
    function balanceAt(address account, uint64 timestamp) external view returns (uint192);
    function clearAccountHistory() external;
}