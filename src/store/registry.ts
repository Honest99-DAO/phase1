import {
  createAsyncActionCreator, defaultAsyncReducer, defaultAsyncSaga,
  defaultAsyncState,
  IAsyncState, lazyLoadSelectSaga
} from '~/store/utils';
import {createReducer, getType} from 'deox';
import {takeLatest} from 'redux-saga/effects';
import {Accountant, HonestCasino, JoiToken, Voting} from '../../types/ethers-contracts';
import {getAccountant, getBlock, getCasino, getJoiToken, getVoting} from '~/api/registry';
import {providers} from 'ethers'


// RO postfix means 'read-only' - these contracts are connected via read-only provider and cannot send any txns
export interface IRegistryState {
  joiTokenRO: IAsyncState<JoiToken>;
  votingRO: IAsyncState<Voting>;
  accountantRO: IAsyncState<Accountant>;
  casinoRO: IAsyncState<HonestCasino>;
  currentBlock: IAsyncState<providers.Block>
}

export const defaultRegistryState: IRegistryState = {
  joiTokenRO: defaultAsyncState(),
  votingRO: defaultAsyncState(),
  accountantRO: defaultAsyncState(),
  casinoRO: defaultAsyncState(),
  currentBlock: defaultAsyncState()
};

export const registryActions = {
  getJoiToken: createAsyncActionCreator<void, JoiToken>('registry/get-joi-token'),
  getVoting: createAsyncActionCreator<void, Voting>('registry/get-voting'),
  getAccountant: createAsyncActionCreator<void, Accountant>('registry/get-accountant'),
  getCasino: createAsyncActionCreator<void, HonestCasino>('registry/get-casino'),
  getCurrentBlock: createAsyncActionCreator<void, providers.Block>('registry/get-current-block')
};

export const registryReducer = createReducer(defaultRegistryState, h => [
  ...defaultAsyncReducer(h, registryActions.getJoiToken, 'joiTokenRO'),
  ...defaultAsyncReducer(h, registryActions.getVoting, 'votingRO'),
  ...defaultAsyncReducer(h, registryActions.getAccountant, 'accountantRO'),
  ...defaultAsyncReducer(h, registryActions.getCasino, 'casinoRO'),
  ...defaultAsyncReducer(h, registryActions.getCurrentBlock, 'currentBlock')
]);


function* getJoiTokenSaga() {
  yield defaultAsyncSaga(registryActions.getJoiToken, getJoiToken);
}

function* getVotingSaga() {
  yield defaultAsyncSaga(registryActions.getVoting, getVoting);
}

function* getAccountantSaga() {
  yield defaultAsyncSaga(registryActions.getAccountant, getAccountant);
}

function* getCasinoSaga() {
  yield defaultAsyncSaga(registryActions.getCasino, getCasino);
}

function* getCurrentBlockSaga() {
  yield defaultAsyncSaga(registryActions.getCurrentBlock, getBlock);
}

export const registryStateSagasConfig = [
  takeLatest(getType(registryActions.getJoiToken.start), getJoiTokenSaga),
  takeLatest(getType(registryActions.getVoting.start), getVotingSaga),
  takeLatest(getType(registryActions.getAccountant.start), getAccountantSaga),
  takeLatest(getType(registryActions.getCasino.start), getCasinoSaga),
  takeLatest(getType(registryActions.getCurrentBlock.start), getCurrentBlockSaga)
];

export function selectJoiTokenSaga() {
  return lazyLoadSelectSaga(state => state.registry.joiTokenRO.data, getJoiTokenSaga);
}

export function selectVotingSaga() {
  return lazyLoadSelectSaga(state => state.registry.votingRO.data, getVotingSaga);
}

export function selectAccountantSaga() {
  return lazyLoadSelectSaga(state => state.registry.accountantRO.data, getAccountantSaga);
}

export function selectCasinoSaga() {
  return lazyLoadSelectSaga(state => state.registry.casinoRO.data, getCasinoSaga);
}
