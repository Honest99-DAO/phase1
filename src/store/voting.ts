import {
  createAsyncActionCreator,
  defaultAsyncReducer,
  defaultAsyncSaga,
  defaultAsyncState,
  IAsyncState
} from '~/store/utils';
import {
  executeVoting, getCommonVoting, getMyVote, getUintChangeVoting, getUpgradeVoting,
  getVotings, ISomeVoting,
  IStartCommonVotingReq, IStartUintChangeVotingReq,
  IStartUpgradeVotingReq, IVoteReq, startCommonVoting, startUintChangeVoting, startUpgradeVoting,
  vote, VoteStatus, VotingType
} from '~/api/voting';
import {BigNumber, Signer} from 'ethers';
import {Action, createReducer, getType} from 'deox';
import {Voting} from '../../types/ethers-contracts';
import {selectVotingSaga} from '~/store/registry';
import {takeLatest} from 'redux-saga/effects';
import {toast} from 'react-toastify';


export interface IVotingState {
  votings: IAsyncState<ISomeVoting[]>;
  currentVoting: IAsyncState<ISomeVoting>;
  currentVotingMyVote: IAsyncState<VoteStatus>;
  startNew: IAsyncState<void>;
  vote: IAsyncState<void>;
  execute: IAsyncState<void>;
}

export interface IStartVotingReq {
  signer: Signer;
  type: VotingType;
  req: IStartCommonVotingReq | IStartUpgradeVotingReq | IStartUintChangeVotingReq;
}

export interface IVoteReqExt {
  req: IVoteReq;
  signer: Signer;
}

export interface IGetVotingReq {
  type: VotingType;
  id: BigNumber;
}

export interface IGetCurrentVotingMyVoteReq {
  signer: Signer;
  votingId: BigNumber;
}

export interface IExecuteReq {
  signer: Signer;
  votingId: BigNumber;
}

export const defaultVotingState: IVotingState = {
  votings: defaultAsyncState(),
  currentVoting: defaultAsyncState(),
  currentVotingMyVote: defaultAsyncState(),
  startNew: defaultAsyncState(),
  vote: defaultAsyncState(),
  execute: defaultAsyncState()
};

export const votingActions = {
  getVotings: createAsyncActionCreator<void, ISomeVoting[]>('voting/get-votings'),
  getCurrentVoting: createAsyncActionCreator<IGetVotingReq, ISomeVoting>('voting/get-current-voting'),
  getCurrentVotingMyVote: createAsyncActionCreator<IGetCurrentVotingMyVoteReq, VoteStatus>('voting/get-current-voting-my-vote'),
  startNew: createAsyncActionCreator<IStartVotingReq, void>('voting/start-new'),
  vote: createAsyncActionCreator<IVoteReqExt, void>('voting/vote'),
  execute: createAsyncActionCreator<IExecuteReq, void>('voting/execute')
};

export const votingReducer = createReducer(defaultVotingState, h => [
  ...defaultAsyncReducer(h, votingActions.getVotings, 'votings'),
  ...defaultAsyncReducer(h, votingActions.getCurrentVoting, 'currentVoting'),
  ...defaultAsyncReducer(h, votingActions.getCurrentVotingMyVote, 'currentVotingMyVote'),
  ...defaultAsyncReducer(h, votingActions.startNew, 'startNew'),
  ...defaultAsyncReducer(h, votingActions.vote, 'vote'),
  ...defaultAsyncReducer(h, votingActions.execute, 'execute')
]);

function* getVotingsSaga() {
  const voting: Voting = yield selectVotingSaga();

  yield defaultAsyncSaga(votingActions.getVotings, () => getVotings(voting));
}

function* getCurrentVotingSaga(action: Action<string, IGetVotingReq>) {
  const voting: Voting = yield selectVotingSaga();

  yield defaultAsyncSaga(votingActions.getCurrentVoting, () => {
    switch (action.payload.type) {
      case VotingType.COMMON:
        return getCommonVoting(voting, action.payload.id);
      case VotingType.UPGRADE:
        return getUpgradeVoting(voting, action.payload.id);
      case VotingType.UINT_CHANGE:
        return getUintChangeVoting(voting, action.payload.id);
      default:
        throw new Error('Invalid voting type');
    }
  });
}

function* getCurrentVotingMyVoteSaga(action: Action<string, IGetCurrentVotingMyVoteReq>) {
  const voting: Voting = yield selectVotingSaga();

  yield defaultAsyncSaga(votingActions.getCurrentVotingMyVote, () => getMyVote(voting, action.payload.signer, action.payload.votingId));
}

function* startNewSaga(action: Action<string, IStartVotingReq>) {
  const voting: Voting = yield selectVotingSaga();

  yield defaultAsyncSaga(votingActions.startNew, async () => {
    switch (action.payload.type) {
      case VotingType.COMMON:
        await startCommonVoting(voting, action.payload.signer, action.payload.req);
        break;
      case VotingType.UPGRADE:
        await startUpgradeVoting(voting, action.payload.signer, action.payload.req as IStartUpgradeVotingReq);
        break;
      case VotingType.UINT_CHANGE:
        await startUintChangeVoting(voting, action.payload.signer, action.payload.req as IStartUintChangeVotingReq);
        break;
      default:
        throw new Error('Invalid voting type');
    }

    toast.info('Your voting has been created!');
  });
}

function* voteSaga(action: Action<string, IVoteReqExt>) {
  const voting: Voting = yield selectVotingSaga();

  yield defaultAsyncSaga(votingActions.vote, async () => {
    await vote(voting, action.payload.signer, action.payload.req);
    toast.info('You voted successfully!');
  });
}

function* executeSaga(action: Action<string, IExecuteReq>) {
  const voting: Voting = yield selectVotingSaga();

  yield defaultAsyncSaga(votingActions.execute, async () => {
    await executeVoting(voting, action.payload.signer, action.payload.votingId);
    toast.info('The voting has been executed!');
  });
}

export const votingSagasConfig = [
  takeLatest(getType(votingActions.getVotings.start), getVotingsSaga),
  takeLatest(getType(votingActions.getCurrentVoting.start), getCurrentVotingSaga),
  takeLatest(getType(votingActions.getCurrentVotingMyVote.start), getCurrentVotingMyVoteSaga),
  takeLatest(getType(votingActions.startNew.start), startNewSaga),
  takeLatest(getType(votingActions.vote.start), voteSaga),
  takeLatest(getType(votingActions.execute.start), executeSaga)
];