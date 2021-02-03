import {BigNumber, Signer} from 'ethers';
import {
  createAsyncActionCreator,
  defaultAsyncReducer,
  defaultAsyncSaga,
  defaultAsyncState,
  IAsyncState,
  IAsyncStateVoid,
} from '~/store/utils';
import {Action, createReducer, getType} from 'deox';
import {takeLatest} from 'redux-saga/effects';
import {JoiToken} from '../../types/ethers-contracts';
import {selectJoiTokenSaga} from '~/store/registry';
import {
  getJoiPerEthMintPricePercent,
  getMaxTotalSupply,
  getMyBalance,
  getMyBalanceAt,
  getTotalSupply,
  mint
} from '~/api/joiToken';


export interface IJoiTokenState {
  totalSupply: IAsyncState<BigNumber>;
  myBalance: IAsyncState<BigNumber>;
  myBalanceAt: IAsyncState<BigNumber>;
  maxTotalSupply: IAsyncState<BigNumber>;
  joiPerEthMintPricePercent: IAsyncState<BigNumber>;
  mint: IAsyncStateVoid;
}

export const defaultJoiTokenState: IJoiTokenState = {
  totalSupply: defaultAsyncState(),
  myBalance: defaultAsyncState(),
  myBalanceAt: defaultAsyncState(),
  maxTotalSupply: defaultAsyncState(),
  joiPerEthMintPricePercent: defaultAsyncState(),
  mint: defaultAsyncState()
};

export interface IGetMyBalanceAtReq {
  timestamp: number;
  signer: Signer;
}

export interface IMintJoiTokenReq {
  amount: BigNumber;
  signer: Signer;
}

export const joiTokenActions = {
  getTotalSupply: createAsyncActionCreator<void, BigNumber>('joi-token/get-total-supply'),
  getMyBalance: createAsyncActionCreator<Signer, BigNumber>('joi-token/get-my-balance'),
  getMyBalanceAt: createAsyncActionCreator<IGetMyBalanceAtReq, BigNumber>('joi-token/get-my-balance-at'),
  getMaxTotalSupply: createAsyncActionCreator<void, BigNumber>('joi-token/get-max-total-supply'),
  getJoiPerEthMintPricePercent: createAsyncActionCreator<void, BigNumber>('joi-token/get-joi-per-eth-mint-price-percent'),
  mint: createAsyncActionCreator<IMintJoiTokenReq, void>('joi-token/mint')
};

export const joiTokenReducer = createReducer(defaultJoiTokenState, h => [
  ...defaultAsyncReducer(h, joiTokenActions.getTotalSupply, 'totalSupply'),
  ...defaultAsyncReducer(h, joiTokenActions.getMyBalance, 'myBalance'),
  ...defaultAsyncReducer(h, joiTokenActions.getMyBalanceAt, 'myBalanceAt'),
  ...defaultAsyncReducer(h, joiTokenActions.getMaxTotalSupply, 'maxTotalSupply'),
  ...defaultAsyncReducer(h, joiTokenActions.getJoiPerEthMintPricePercent, 'joiPerEthMintPricePercent'),
  ...defaultAsyncReducer(h, joiTokenActions.mint, 'mint')
]);

function* getTotalSupplySaga() {
  const token: JoiToken = yield selectJoiTokenSaga();

  yield defaultAsyncSaga(joiTokenActions.getTotalSupply, () => getTotalSupply(token));
}

function* getMyBalanceSaga(action: Action<string, Signer>) {
  const token: JoiToken = yield selectJoiTokenSaga();

  yield defaultAsyncSaga(joiTokenActions.getMyBalance, () => getMyBalance(token, action.payload));
}

function* getMyBalanceAtSaga(action: Action<string, IGetMyBalanceAtReq>) {
  const token: JoiToken = yield selectJoiTokenSaga();

  yield defaultAsyncSaga(joiTokenActions.getMyBalanceAt, () => getMyBalanceAt(token, action.payload.signer, action.payload.timestamp));
}

function* getMaxTotalSupplySaga() {
  const token: JoiToken = yield selectJoiTokenSaga();

  yield defaultAsyncSaga(joiTokenActions.getMaxTotalSupply, () => getMaxTotalSupply(token));
}

function* getJoiPerEthMintPricePercentSaga() {
  const token: JoiToken = yield selectJoiTokenSaga();

  yield defaultAsyncSaga(joiTokenActions.getJoiPerEthMintPricePercent, () => getJoiPerEthMintPricePercent(token));
}

function* mintJoiTokenSaga(action: Action<string, IMintJoiTokenReq>) {
  const token: JoiToken = yield selectJoiTokenSaga();

  yield defaultAsyncSaga(joiTokenActions.mint, () => mint(token, action.payload.signer, action.payload.amount));
}

export const joiTokenSagasConfig = [
  takeLatest(getType(joiTokenActions.getTotalSupply.start), getTotalSupplySaga),
  takeLatest(getType(joiTokenActions.getMyBalance.start), getMyBalanceSaga),
  takeLatest(getType(joiTokenActions.getMyBalanceAt.start), getMyBalanceAtSaga),
  takeLatest(getType(joiTokenActions.getMaxTotalSupply.start), getMaxTotalSupplySaga),
  takeLatest(getType(joiTokenActions.getJoiPerEthMintPricePercent.start), getJoiPerEthMintPricePercentSaga),
  takeLatest(getType(joiTokenActions.mint.start), mintJoiTokenSaga)
];