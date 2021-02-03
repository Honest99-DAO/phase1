// SPDX-License-Identifier: MIT

pragma solidity >0.6.1 <0.7.0;

import "./Registered.sol";
import "./Utils.sol";


abstract contract RegisteredWithCapital is Registered {
    bool locked;

    function lockOn() external onlyByVoting {
        locked = true;
    }

    function lockOff() external onlyByVoting {
        locked = false;
    }

    function migrateCapital(address nextVersion) external onlyByVoting {
        require(nextVersion != Utils.EMPTY_ADDRESS, "$RWC1");
        payable(nextVersion).transfer(address(this).balance);
    }
}