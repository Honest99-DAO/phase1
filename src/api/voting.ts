import {Voting} from '../../types/ethers-contracts';
import {BigNumber, Signer} from 'ethers';


export interface ISomeVoting {
  votingSuperType: VotingType;
  id: BigNumber;
  createdAt: number;
  duration: number;
  description: string;
  totalAccepted: BigNumber;
  totalRejected: BigNumber;
  executed: boolean;
}

export interface ICommonVoting extends ISomeVoting {
}

export function parseCommonVoting(
  id: BigNumber,
  votingArr: {0: BigNumber, 1: number, 2: string, 3: boolean, 4: BigNumber, 5: BigNumber}
): ICommonVoting {
  return {
    id,
    votingSuperType: VotingType.COMMON,
    createdAt: votingArr[0].toNumber(),
    duration: votingArr[1],
    description: votingArr[2],
    executed: votingArr[3],
    totalAccepted: votingArr[4],
    totalRejected: votingArr[5]
  }
}

export interface IUpgradeVoting extends ICommonVoting {
  type: ContractType;
  nextVersionAddress: string;
}

export function parseUpgradeVoting(
  id: BigNumber,
  votingArr: {0: BigNumber, 1: number, 2: string, 3: boolean, 4: BigNumber, 5: BigNumber, 6: number, 7: string}
): IUpgradeVoting {
  const common = parseCommonVoting(id, votingArr);

  return {
    ...common,
    votingSuperType: VotingType.UPGRADE,
    type: votingArr[6],
    nextVersionAddress: votingArr[7]
  }
}

export enum NineTokenParameter {
  MAX_TOTAL_SUPPLY, NINE_PER_ETH_MINT_PRICE_PERCENT
}

export enum AccountantParameter {
  MAINTENANCE_PERCENT, DISTRIBUTION_SESSION_INTERVAL
}

export interface IUintChangeVoting extends ICommonVoting {
  type: ContractType;
  parameterIdx: NineTokenParameter | AccountantParameter;
  newValue: BigNumber;
}

export function parseUintChangeVoting(
  id: BigNumber,
  votingArr: {0: BigNumber, 1: number, 2: string, 3: boolean, 4: BigNumber, 5: BigNumber, 6: number, 7: number, 8: BigNumber}
): IUintChangeVoting {
  const common = parseCommonVoting(id, votingArr);

  return {
    ...common,
    votingSuperType: VotingType.UINT_CHANGE,
    type: votingArr[6],
    parameterIdx: votingArr[7],
    newValue: votingArr[8]
  }
}

export interface IStartCommonVotingReq {
  durationSec: number;
  description: string;
}

export interface IStartUpgradeVotingReq extends IStartCommonVotingReq {
  type: ContractType;
  nextVersionAddress: string;
}

export interface IStartUintChangeVotingReq extends IStartCommonVotingReq {
  type: ContractType;
  parameterIdx: NineTokenParameter | AccountantParameter;
  newValue: BigNumber;
}

export interface IVoteReq {
  votingId: BigNumber;
  status: VoteStatus;
}

export enum VotingType {
  NONE, COMMON, UPGRADE, UINT_CHANGE, LEADER_ELECT
}

export enum ContractType {
  NONE,
  CASINO,
  VOTING,
  ACCOUNTANT,
  NINE_TOKEN,
  REGISTRY
}

export function votingTypeToString(type: VotingType): string {
  switch (type) {
    case VotingType.NONE:
      return 'NONE';
    case VotingType.COMMON:
      return 'COMMON';
    case VotingType.UPGRADE:
      return 'UPGRADE';
    case VotingType.UINT_CHANGE:
      return 'CHANGE';
    case VotingType.LEADER_ELECT:
      return 'ELECTION'
  }
}

export function votingTypeFromString(type: string): VotingType {
  switch (type.toUpperCase()) {
    case 'COMMON':
      return VotingType.COMMON;
    case 'UPGRADE':
      return VotingType.UPGRADE;
    case 'CHANGE':
      return VotingType.UINT_CHANGE;
    case 'ELECTION':
      return VotingType.LEADER_ELECT;
    default:
      return VotingType.NONE;
  }
}

export enum VoteStatus {
  NONE = 0, ACCEPT = 1, REJECT = 2
}

export async function getVotings(voting: Voting): Promise<ISomeVoting[]> {
  const filter = voting.filters.VotingStarted(null, null);
  const events = await voting.queryFilter(filter);

  const votingEvents: {id: BigNumber, type: VotingType}[] = events
    .map(it => ({id: it.args!['votingId'], type: it.args!['votingType']}));

  const votingsRaw = await Promise.all(votingEvents.map(event => {
    switch (event.type) {
      case VotingType.COMMON:
        return getCommonVoting(voting, event.id);
      case VotingType.UPGRADE:
        return getUpgradeVoting(voting, event.id);
      case VotingType.UINT_CHANGE:
        return getUintChangeVoting(voting, event.id);
      default:
        return null;
    }
  }));

  return votingsRaw.filter(it => it != null) as ISomeVoting[];
}

export async function getCommonVoting(votingRO: Voting, id: BigNumber): Promise<ICommonVoting> {
  const votingRaw = await votingRO.getCommonVoting(id);

  return parseCommonVoting(id, votingRaw);
}

export async function getUpgradeVoting(votingRO: Voting, id: BigNumber): Promise<IUpgradeVoting> {
  const votingRaw = await votingRO.getUpgradeVoting(id);

  return parseUpgradeVoting(id, votingRaw);
}

export async function getUintChangeVoting(votingRO: Voting, id: BigNumber): Promise<IUintChangeVoting> {
  const votingRaw = await votingRO.getUintChangeVoting(id);

  return parseUintChangeVoting(id, votingRaw);
}

export async function getMyVote(votingRO: Voting, signer: Signer, id: BigNumber): Promise<VoteStatus> {
  const address = await signer.getAddress();

  return votingRO.getVoteOf(id, address);
}

export async function startCommonVoting(votingRO: Voting, signer: Signer, req: IStartCommonVotingReq) {
  const votingRW = votingRO.connect(signer);

  const tx = await votingRW.startCommonVoting(req.durationSec, req.description);
  await tx.wait();
}

export async function startUpgradeVoting(votingRO: Voting, signer: Signer, req: IStartUpgradeVotingReq) {
  const votingRW = votingRO.connect(signer);

  const tx = await votingRW.startUpgradeVoting(req.type, req.durationSec, req.nextVersionAddress, req.description);
  await tx.wait();
}

export async function startUintChangeVoting(votingRO: Voting, signer: Signer, req: IStartUintChangeVotingReq) {
  const votingRW = votingRO.connect(signer);

  const tx = await votingRW.startUintChangeVoting(req.type, req.parameterIdx, req.durationSec, req.newValue, req.description);
  await tx.wait();
}

export async function vote(votingRO: Voting, signer: Signer, vote: IVoteReq) {
  const votingRW = votingRO.connect(signer);

  const tx = await votingRW.vote(vote.votingId, vote.status);
  await tx.wait();
}

export async function executeVoting(votingRO: Voting, signer: Signer, id: BigNumber) {
  const votingRW = votingRO.connect(signer);

  const tx = await votingRW.executeVoting(id);
  await tx.wait();
}
