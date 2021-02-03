// SPDX-License-Identifier: MIT

pragma solidity >0.6.1 <0.7.0;

import "./INineToken.sol";


interface IRegistry {
    function getCasino() external view returns (address);

    function getVoting() external view returns (address);

    function getAccountant() external view returns (address);

    function getNineToken() external view returns (address);

    function setCasino(address _casino) external;

    function setVoting(address _voting) external;

    function setAccountant(address _accountant) external;

    function setNineToken(address _nineToken) external;
}