// SPDX-License-Identifier: MIT

pragma solidity >0.6.1 <0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./additional/RegisteredWithCapital.sol";


contract HonestCasino is RegisteredWithCapital {
    using SafeMath for uint256;

    struct GuessEntry {
        uint72 bet;
        uint16 nonce;
        uint8 number;
        uint64 blockNumber;
    }

    uint256 constant MAX_PRIZE = 200 ether; // fits in uint72

    uint256 nonce = 0;
    mapping(address => GuessEntry) guesses;

    event Guess(address indexed guesser, uint72 bet, uint16 nonce, uint8 number);
    event PrizeClaim(address indexed guesser, uint8 number, uint72 prizeValue);

    receive() external payable {
    }

    function guess(uint8 guessNumber) external payable {
        // checking input
        require(guessNumber < 100, "$CAS1");
        uint256 fee = msg.value / 101;
        uint256 bet = msg.value - fee;

        uint256 prize = bet.mul(99);
        require(prize <= address(this).balance / 2, "$CAS2");
        require(prize <= MAX_PRIZE, "$CAS3");

        uint16 n = incNonce();
        emit Guess(msg.sender, uint72(bet), n, guessNumber);

        // placing a bet
        guesses[msg.sender] = GuessEntry(uint72(bet), n, guessNumber, uint64(block.number));

        // sending 1% fee to the Accountant contract
        (bool success, ) = payable(registry.getAccountant()).call{value: fee}("");
        require(success, "$CAS7");
    }

    function claimPrize(address account) external {
        GuessEntry storage entry = guesses[account];
        uint256 entryBet = entry.bet;
        uint256 entryBlockNumber = entry.blockNumber;

        // checking inputs
        require(entryBet > 0, "$CAS4");

        uint256 prize = entryBet * 99; // we already know this can't overflow
        entry.bet = 0;

        // if there is not enough funds - give at least a half
        if (prize > address(this).balance / 2) {
            prize = address(this).balance / 2;
        }

        // sending prize if the number is correct
        uint256 randomNumber = calculateRandomNumber(entryBlockNumber, entry.nonce);

        if (randomNumber == uint256(entry.number)) {
            emit PrizeClaim(account, uint8(randomNumber), uint72(prize));
            payable(account).transfer(prize);
        }
    }

    function __initialSetRegistry(IRegistry _registry) external {
        require(address(registry) == Utils.EMPTY_ADDRESS, "$RGD1");

        registry = _registry;
    }

    function calculateRandomNumber(uint256 blockNumber, uint16 _nonce) internal view returns (uint256) {
        require(block.number - blockNumber < 256, "$CAS5"); // not after 255 blocks pass
        require(block.number - blockNumber > 0, "$CAS8"); // not in the same block

        return uint256(keccak256(abi.encodePacked(blockhash(blockNumber), _nonce))) % 100;
    }

    function incNonce() internal returns (uint16) {
        if (nonce < 0xffff) {
            return uint16(nonce++);
        } else {
            nonce = 0;
            return 0;
        }
    }
}