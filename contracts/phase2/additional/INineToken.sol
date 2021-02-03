// SPDX-License-Identifier: MIT

pragma solidity >0.6.1 <0.7.0;


interface INineToken {
    function getLeader() external view returns (address);
    function setLeader(address payable newLeader) external;
}