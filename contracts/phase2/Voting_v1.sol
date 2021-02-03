// SPDX-License-Identifier: MIT

pragma solidity >0.6.1 <0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./additional/IERC20WithHistory.sol";
import "./additional/Utils.sol";
import "./additional/RegisteredWithCapital.sol";
import "./additional/INineToken.sol";


contract Voting is Registered {
    using SafeMath for uint256;

    enum VotingType {
        NONE, COMMON, UPGRADE, UINT_CHANGE, LEADER_ELECT
    }

    enum ContractType {
        NONE,
        CASINO,
        VOTING,
        ACCOUNTANT,
        NINE_TOKEN,
        REGISTRY
    }

    enum VoteStatus {
        NONE, ACCEPT, REJECT
    }

    enum VotingResult {
        NONE, ACCEPT, REJECT, NOT_APPLIED
    }

    struct VotingDetails {
        uint192 nineTokenTotalSupply;
        uint64 createdAt;
        uint192 totalAccepted;
        uint32 duration;
        bool executed;
        uint192 totalRejected;
        string description;
        mapping(address => VoteStatus) voteByAccount;
    }

    struct CommonVoting {
        VotingDetails details;
    }

    struct UpgradeVoting {
        VotingDetails details;
        ContractType contractType;
        address nextVersion;
    }

    struct UintChangeVoting {
        VotingDetails details;
        ContractType contractType;
        uint8 parameterIdx;
        uint256 newValue;
    }

    struct LeaderElection {
        VotingDetails details;
        address payable newLeader;
    }

    event VotingStarted(uint256 indexed votingId, VotingType indexed votingType);
    event VotePlaced(uint256 indexed votingId, address voter, VoteStatus status, uint256 voteWeight);
    event VotingExecuted(uint256 indexed votingId, VotingResult result);

    uint256 votingIdsCounter;
    mapping(uint256 => VotingType) votingTypes;
    mapping(uint256 => CommonVoting) commonVotings;
    mapping(uint256 => UpgradeVoting) upgradeVotings;
    mapping(uint256 => UintChangeVoting) uintChangeVotings;
    mapping(uint256 => LeaderElection) leaderElections;

    function startCommonVoting(uint32 duration, string calldata description) external {
        // checking inputs
        require(duration <= 365 days, "$VOT1");
        address nineToken = registry.getNineToken();
        require(IERC20(nineToken).balanceOf(msg.sender) > 0, "$VOT2");

        // creating new voting
        uint256 votingId = votingIdsCounter++;

        votingTypes[votingId] = VotingType.COMMON;
        commonVotings[votingId] = CommonVoting(
            createVotingDetails(duration, description, IERC20(nineToken))
        );

        emit VotingStarted(votingId, VotingType.COMMON);
    }

    function startUpgradeVoting(
        ContractType contractType,
        uint32 duration,
        address nextVersion,
        string calldata description
    )
        external
    {
        // checking inputs
        address nineToken = registry.getNineToken();
        require(INineToken(nineToken).getLeader() == msg.sender, "$VOT19");

        require(contractType != ContractType.NONE, "$VOT3");
        require(nextVersion != Utils.EMPTY_ADDRESS, "$VOT4");
        require(duration <= 365 days, "$VOT1");

        // creating new voting
        uint256 votingId = votingIdsCounter++;

        votingTypes[votingId] = VotingType.UPGRADE;
        upgradeVotings[votingId] = UpgradeVoting(
            createVotingDetails(duration, description, IERC20(nineToken)),
            contractType,
            nextVersion
        );

        emit VotingStarted(votingId, VotingType.UPGRADE);
    }

    function startUintChangeVoting(
        ContractType contractType,
        uint8 parameterIdx,
        uint32 duration,
        uint256 newValue,
        string calldata description
    )
        external
    {
        // checking inputs
        require(contractType != ContractType.NONE, "$VOT7");
        require(duration <= 365 days, "$VOT1");
        require(duration >= 7 days, "$VOT8");
        address nineToken = registry.getNineToken();
        require(IERC20(nineToken).balanceOf(msg.sender) > 0, "$VOT2");

        // creating new voting
        uint256 votingId = votingIdsCounter++;

        votingTypes[votingId] = VotingType.UINT_CHANGE;
        uintChangeVotings[votingId] = UintChangeVoting(
            createVotingDetails(duration, description, IERC20(nineToken)),
            contractType,
            parameterIdx,
            newValue
        );

        emit VotingStarted(votingId, VotingType.UINT_CHANGE);
    }

    function startLeaderElection(
        uint32 duration,
        address payable newLeader,
        string calldata description
    )
        external
    {
        require(newLeader != Utils.EMPTY_ADDRESS, "$VOT4");
        require(duration <= 365 days, "$VOT1");
        require(duration >= 14 days, "$VOT5");
        address nineToken = registry.getNineToken();
        require(IERC20(nineToken).balanceOf(msg.sender) >= 10 ether, "$VOT6");

        // creating new voting
        uint256 votingId = votingIdsCounter++;

        votingTypes[votingId] = VotingType.LEADER_ELECT;
        leaderElections[votingId] = LeaderElection(
            createVotingDetails(duration, description, IERC20(nineToken)),
            newLeader
        );

        emit VotingStarted(votingId, VotingType.LEADER_ELECT);
    }

    function vote(uint256 votingId, VoteStatus status) external {
        // retrieving voting details
        VotingType votingType = getVotingType(votingId);
        VotingDetails storage votingDetails = getVotingDetails(votingId, votingType);

        // checking the voter ability to vote
        require(status != VoteStatus.NONE, "$VOT17");
        require(votingDetails.createdAt != block.timestamp, "$VOT18");
        require(votingDetails.createdAt + votingDetails.duration > block.timestamp, "$VOT11");

        uint256 accountWeight = IERC20WithHistory(registry.getNineToken()).balanceAt(msg.sender, votingDetails.createdAt);

        // removing old vote
        VoteStatus alreadyVotedStatus = votingDetails.voteByAccount[msg.sender];

        if (alreadyVotedStatus == VoteStatus.ACCEPT) {
            votingDetails.totalAccepted = uint192(votingDetails.totalAccepted - accountWeight);
        } else if (alreadyVotedStatus == VoteStatus.REJECT) {
            votingDetails.totalRejected = uint192(votingDetails.totalRejected - accountWeight);
        }

        votingDetails.voteByAccount[msg.sender] = status;

        // adding vote and updating totals
        if (status == VoteStatus.ACCEPT) {
            votingDetails.totalAccepted = uint192(votingDetails.totalAccepted + accountWeight);
        } else {
            votingDetails.totalRejected = uint192(votingDetails.totalRejected + accountWeight);
        }

        emit VotePlaced(votingId, msg.sender, status, accountWeight);
    }

    function executeVoting(uint256 votingId) external {
        // retrieving voting details
        VotingType votingType = getVotingType(votingId);
        VotingDetails storage votingDetails = getVotingDetails(votingId, votingType);

        // checking inputs
        require(!votingDetails.executed, "$VOT13");
        require(votingDetails.createdAt + votingDetails.duration < block.timestamp, "$VOT14");
        address nineToken = registry.getNineToken();
        require(IERC20(nineToken).balanceOf(msg.sender) >= 10 ether, "$VOT15");

        // calculating voting result
        // the voting considered successful only when total voted weight is more than 20% of total supply
        uint256 votingThreshold = uint256(votingDetails.nineTokenTotalSupply).mul(Utils.VOTING_THRESHOLD_PERCENT) / 100;
        VotingResult result;
        if (votingDetails.totalAccepted + votingDetails.totalRejected >= votingThreshold) {
            if (votingDetails.totalAccepted > votingDetails.totalRejected) {
                result = VotingResult.ACCEPT;
            } else {
                result = VotingResult.REJECT;
            }
        } else {
            result = VotingResult.NOT_APPLIED;
        }

        votingDetails.executed = true;
        emit VotingExecuted(votingId, result);

        // if voting result is ACCEPT (majority capital decided to accept the voting + 20% threshold passed)
        // and if the subject of voting was to upgrade or change any contract - execute
        if (result == VotingResult.ACCEPT) {
            if (votingType == VotingType.UPGRADE) {
                UpgradeVoting storage voting = upgradeVotings[votingId];
                executeUpgradeVoting(voting.contractType, voting.nextVersion);

            } else if (votingType == VotingType.UINT_CHANGE) {
                UintChangeVoting storage voting = uintChangeVotings[votingId];
                executeUintChangeVoting(voting.contractType, voting.parameterIdx, voting.newValue);

            } else if (votingType == VotingType.LEADER_ELECT) {
                LeaderElection storage election = leaderElections[votingId];
                executeLeaderElection(election.newLeader, INineToken(nineToken));

            }
        }
    }

    function executeUpgradeVoting(ContractType contractType, address nextVersion) internal {
        if (contractType == ContractType.CASINO) {
            RegisteredWithCapital prevCasino = RegisteredWithCapital(registry.getCasino());
            RegisteredWithCapital nextCasino = RegisteredWithCapital(nextVersion);

            registry.setCasino(nextVersion);
            nextCasino.lockOn();
            prevCasino.migrateCapital(nextVersion);
            nextCasino.lockOff();

        } else if (contractType == ContractType.VOTING) {
            registry.setVoting(nextVersion);

        } else if (contractType == ContractType.ACCOUNTANT) {
            RegisteredWithCapital prevAccountant = RegisteredWithCapital(registry.getAccountant());
            RegisteredWithCapital nextAccountant = RegisteredWithCapital(nextVersion);

            registry.setAccountant(nextVersion);
            nextAccountant.lockOn();
            prevAccountant.migrateCapital(nextVersion);
            nextAccountant.lockOff();
        }
    }

    function executeUintChangeVoting(
        ContractType contractType,
        uint8 parameterIdx,
        uint256 newValue
    ) internal {
        if (contractType == ContractType.NINE_TOKEN) {
            Registered(registry.getNineToken()).setUintParameter(parameterIdx, newValue);

        } else if (contractType == ContractType.ACCOUNTANT) {
            Registered(registry.getAccountant()).setUintParameter(parameterIdx, newValue);

        }
    }

    function executeLeaderElection(address payable newLeader, INineToken nineToken) internal {
        nineToken.setLeader(newLeader);
    }

    function getVoteOf(uint256 votingId, address voter) external view returns (VoteStatus) {
        VotingType votingType = getVotingType(votingId);
        VotingDetails storage votingDetails = getVotingDetails(votingId, votingType);

        return votingDetails.voteByAccount[voter];
    }

    function getCommonVoting(uint256 votingId) external view returns (
        uint64 createdAt,
        uint32 duration,
        string memory description,
        bool executed,
        uint192 totalAccepted,
        uint192 totalRejected
    ) {
        CommonVoting storage voting = commonVotings[votingId];

        return (
            voting.details.createdAt,
            voting.details.duration,
            voting.details.description,
            voting.details.executed,
            voting.details.totalAccepted,
            voting.details.totalRejected
        );
    }

    function getUpgradeVoting(uint256 votingId) external view returns (
        uint64 createdAt,
        uint32 duration,
        string memory description,
        bool executed,
        uint192 totalAccepted,
        uint192 totalRejected,
        ContractType contractType,
        address nextVersion
    ) {
        UpgradeVoting storage voting = upgradeVotings[votingId];

        return (
            voting.details.createdAt,
            voting.details.duration,
            voting.details.description,
            voting.details.executed,
            voting.details.totalAccepted,
            voting.details.totalRejected,
            voting.contractType,
            voting.nextVersion
        );
    }

    function getUintChangeVoting(uint256 votingId) external view returns (
        uint64 createdAt,
        uint32 duration,
        string memory description,
        bool executed,
        uint192 totalAccepted,
        uint192 totalRejected,
        ContractType contractType,
        uint8 parameterIdx,
        uint256 newValue
    ) {
        UintChangeVoting storage voting = uintChangeVotings[votingId];

        return (
            voting.details.createdAt,
            voting.details.duration,
            voting.details.description,
            voting.details.executed,
            voting.details.totalAccepted,
            voting.details.totalRejected,
            voting.contractType,
            voting.parameterIdx,
            voting.newValue
        );
    }

    function __initialSetRegistry(IRegistry _registry) external {
        require(address(registry) == Utils.EMPTY_ADDRESS, "$RGD1");

        registry = _registry;
    }

    function getVotingType(uint votingId) internal view returns (VotingType) {
        VotingType votingType = votingTypes[votingId];
        require(votingType != VotingType.NONE, "$VOT16");

        return votingType;
    }

    function getVotingDetails(
        uint256 votingId,
        VotingType votingType
    )
        internal
        view
        returns (VotingDetails storage)
    {
        VotingDetails storage votingDetails;

        if (votingType == VotingType.COMMON) {
            votingDetails = commonVotings[votingId].details;
        } else if (votingType == VotingType.UPGRADE) {
            votingDetails = upgradeVotings[votingId].details;
        } else if (votingType == VotingType.UINT_CHANGE) {
            votingDetails = uintChangeVotings[votingId].details;
        } else if (votingType == VotingType.LEADER_ELECT) {
            votingDetails = leaderElections[votingId].details;
        } else {
            // default to unset
            votingDetails = upgradeVotings[Utils.MAX_UINT].details;
        }

        require(votingDetails.createdAt > 0, "$VOT16");

        return votingDetails;
    }

    function createVotingDetails(
        uint32 duration,
        string memory description,
        IERC20 nineToken
    )
        internal
        view
        returns (VotingDetails memory)
    {
        return VotingDetails(
            uint192(nineToken.totalSupply()),
            uint64(block.timestamp),
            0,
            duration,
            false,
            0,
            description
        );
    }
}