// SPDX-License-Identifier: MIT

pragma solidity >0.6.1 <0.7.0;

import "./additional/IRegistry.sol";
import "./additional/Utils.sol";


contract Registry is IRegistry {
    address private casino;
    address private voting;
    address private accountant;
    address private nineToken;

    constructor(
        address _casino,
        address _voting,
        address _accountant,
        address _nineToken
    )
        public
    {
        casino = _casino;
        voting = _voting;
        accountant = _accountant;
        nineToken = _nineToken;
    }

    function setCasino(address _casino) external override onlyByVoting {
        casino = _casino;
    }

    function setVoting(address _voting) external override onlyByVoting {
        voting = _voting;
    }

    function setAccountant(address _accountant) external override onlyByVoting {
        accountant = _accountant;
    }

    function setNineToken(address _nineToken) external override onlyByVoting {
        nineToken = _nineToken;
    }

    function getCasino() external override view returns (address) {
        require(casino != Utils.EMPTY_ADDRESS, "$REG1");
        return casino;
    }

    function getVoting() external override view returns (address) {
        require(voting != Utils.EMPTY_ADDRESS, "$REG2");
        return voting;
    }

    function getAccountant() external override view returns (address) {
        require(accountant != Utils.EMPTY_ADDRESS, "$REG3");
        return accountant;
    }

    function getNineToken() external override view returns (address) {
        require(nineToken != Utils.EMPTY_ADDRESS, "$REG4");
        return nineToken;
    }

    modifier onlyByVoting() {
        require(msg.sender == voting, "$REG5");
        _;
    }
}