// SPDX-License-Identifier: MIT

pragma solidity >0.6.1 <0.7.0;

import "./IRegistry.sol";
import "./Utils.sol";


abstract contract Registered {
    IRegistry registry;

    function setRegistry(IRegistry _registry) external onlyByVoting {
        registry = _registry;
    }

    function getRegistry() public view returns (IRegistry) {
        require(address(registry) != Utils.EMPTY_ADDRESS, "$RGD2");

        return registry;
    }

    function getUintParameter(uint8 idx) public virtual view returns (uint256) {
        return 0;
    }

    function setUintParameter(uint8 idx, uint256 value) public virtual {}

    modifier onlyByVoting() {
        require(msg.sender == registry.getVoting(), "$RGD3");
        _;
    }
}