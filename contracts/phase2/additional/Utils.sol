// SPDX-License-Identifier: MIT

pragma solidity >0.6.1 <0.7.0;

library Utils {
    uint256 public constant VOTING_THRESHOLD_PERCENT = 20;
    uint256 public constant MAX_UINT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    address public constant EMPTY_ADDRESS = address(0);
    bytes public constant EMPTY_BYTES = new bytes(0);
}