import {BigNumber, Signer} from 'ethers';
import {
  createAsyncActionCreator,
  defaultAsyncReducer,
  defaultAsyncSaga,
  defaultAsyncState,
  IAsyncState,
  IAsyncStateVoid,
  lazyLoadSelectSaga
} from '~/store/utils';
import {Action, createReducer, getType} from 'deox';
import {Accountant, JoiToken} from '../../types/ethers-contracts';
import {selectAccountantSaga, selectJoiTokenSaga} from '~/store/registry';
import {takeLatest} from 'redux-saga/effects';
import {toast} from 'react-toastify';
import {getCurrentPayoutPeriod, IPayoutPeriodResetEvent, receivePayout, resetPayoutPeriod} from '~/api/accountant';
import {getMyBalanceAt} from '~/api/joiToken';


export interface IAccountantState {
  myCurrentProfit: IAsyncState<BigNumber>;
  currentPayoutPeriod: IAsyncState<IPayoutPeriodResetEvent>;
  myPayout: IAsyncStateVoid;
  resetPayoutPeriod: IAsyncStateVoid;
}

export const defaultAccountantState: IAccountantState = {
  myCurrentProfit: defaultAsyncState(),
  currentPayoutPeriod: defaultAsyncState(),
  myPayout: defaultAsyncState(),
  resetPayoutPeriod: defaultAsyncState()
};

export const accountantActions = {
  getMyCurrentProfit: createAsyncActionCreator<Signer, BigNumber>('accountant/get-my-current-profit'),
  getCurrentPayoutPeriod: createAsyncActionCreator<void, IPayoutPeriodResetEvent>('accountant/get-current-payout-period'),
  receivePayout: createAsyncActionCreator<Signer, void>('accountant/receive-payout'),
  resetPayoutPeriod: createAsyncActionCreator<Signer, void>('accountant/reset-payout-period')
};

export const accountantReducer = createReducer(defaultAccountantState, h => [
  ...defaultAsyncReducer(h, accountantActions.getMyCurrentProfit, 'myCurrentProfit'),
  ...defaultAsyncReducer(h, accountantActions.getCurrentPayoutPeriod, 'currentPayoutPeriod'),
  ...defaultAsyncReducer(h, accountantActions.receivePayout, 'myPayout'),
  ...defaultAsyncReducer(h, accountantActions.resetPayoutPeriod, 'resetPayoutPeriod')
]);

function* getMyCurrentProfitSaga(action: Action<string, Signer>) {
  const token: JoiToken = yield selectJoiTokenSaga();
  // two yields, because there is 2 generator steps inside that saga
  const currentPeriod: IPayoutPeriodResetEvent = yield yield selectCurrentPayoutPeriodSaga();

  yield defaultAsyncSaga(accountantActions.getMyCurrentProfit, async () => {
    const balanceAtPeriodStart = await getMyBalanceAt(token, action.payload, currentPeriod.startedAt);

    return currentPeriod.totalJoiSupplySnapshot.gt(0)
      ? currentPeriod.payoutBalanceSnapshot.mul(balanceAtPeriodStart).div(currentPeriod.totalJoiSupplySnapshot)
      : BigNumber.from(0);
  });
}

function* selectCurrentPayoutPeriodSaga() {
  return lazyLoadSelectSaga(state => state.accountant.currentPayoutPeriod.data, getCurrentPayoutPeriodSaga);
}

function* getCurrentPayoutPeriodSaga() {
  const accountant: Accountant = yield selectAccountantSaga();

  yield defaultAsyncSaga(accountantActions.getCurrentPayoutPeriod, () => getCurrentPayoutPeriod(accountant));
}

function* resetPayoutPeriodSaga(action: Action<string, Signer>) {
  const accountant: Accountant = yield selectAccountantSaga();

  yield defaultAsyncSaga(accountantActions.resetPayoutPeriod, async () => {
    await resetPayoutPeriod(accountant, action.payload);
    toast.info('Success! Dividends distribution session reset.');
  });
}

function* receivePayoutSaga(action: Action<string, Signer>) {
  const accountant: Accountant = yield selectAccountantSaga();

  yield defaultAsyncSaga(accountantActions.receivePayout, async () => {
    await receivePayout(accountant, action.payload);
    toast.success('Success! Check your wallet balance.');
  });
}

export const accountantSagasConfig = [
  takeLatest(getType(accountantActions.getMyCurrentProfit.start), getMyCurrentProfitSaga),
  takeLatest(getType(accountantActions.getCurrentPayoutPeriod.start), getCurrentPayoutPeriodSaga),
  takeLatest(getType(accountantActions.receivePayout.start), receivePayoutSaga),
  takeLatest(getType(accountantActions.resetPayoutPeriod.start), resetPayoutPeriodSaga)
];