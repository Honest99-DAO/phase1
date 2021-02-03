// SPDX-License-Identifier: MIT

pragma solidity >0.6.1 <0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract HonestCasino is Ownable {
    using SafeMath for uint256;

    struct GuessEntry {
        uint72 bet;
        uint16 nonce;
        uint8 number;
        uint64 blockNumber;
    }

    uint256 constant MAX_PRIZE = 200 ether; // fits in uint72

    uint16 nonce = 0;
    uint8 public prizeMultiplier = 95;
    mapping(address => GuessEntry) guesses;

    event Guess(address indexed guesser, uint72 bet, uint16 nonce, uint8 number);
    event PrizeClaim(address indexed guesser, uint8 number, uint72 prizeValue);

    receive() external payable {
    }

    function guess(uint8 guessNumber) external payable {
        // checking inputs
        require(guessNumber < 100, "$CAS1");
        uint256 fee = msg.value / 101;
        uint256 bet = msg.value - fee;

        uint256 prize = bet.mul(prizeMultiplier);
        require(prize <= address(this).balance / 2, "$CAS2");
        require(prize <= MAX_PRIZE, "$CAS3");

        nonce++;
        emit Guess(msg.sender, uint72(bet), nonce, guessNumber);

        // placing a bet
        guesses[msg.sender] = GuessEntry(uint72(bet), nonce, guessNumber, uint64(block.number));

        // sending 1% fee to the owner
        payable(this.owner()).transfer(fee);
    }

    function claimPrize(address account) external {
        GuessEntry storage entry = guesses[account];
        uint256 entryBet = entry.bet;
        uint256 entryBlockNumber = entry.blockNumber;

        // checking inputs
        require(entryBet > 0, "$CAS4");

        uint256 prize = entryBet * prizeMultiplier; // we already know this can't overflow
        entry.bet = 0;

        // if there is not enough funds - give at least a half
        if (prize > address(this).balance / 2) {
            prize = address(this).balance / 2;
        }

        // if there is enough ethers in the prize fund - make the EV neutral
        if (address(this).balance >= 400 ether && prizeMultiplier == 95) {
            prizeMultiplier = 99;
        } else if (address(this).balance < 400 ether && prizeMultiplier == 99) {
            prizeMultiplier = 95;
        }

        // sending prize if the number is correct
        uint256 randomNumber = calculateRandomNumber(entryBlockNumber, entry.nonce);

        if (randomNumber == uint256(entry.number)) {
            emit PrizeClaim(account, uint8(randomNumber), uint72(prize));
            payable(account).transfer(prize);
        }
    }

    // in case of update
    function migrateCapital(address nextVersion) external onlyOwner {
        require(nextVersion != address(0), "$RWC1");
        payable(nextVersion).transfer(address(this).balance);
    }

    function calculateRandomNumber(uint256 blockNumber, uint16 _nonce) internal view returns (uint256) {
        require(block.number - blockNumber < 256, "$CAS5"); // not after 255 blocks pass
        require(block.number - blockNumber > 0, "$CAS8"); // not in the same block

        return uint256(keccak256(abi.encodePacked(blockhash(blockNumber), _nonce))) % 100;
    }
}