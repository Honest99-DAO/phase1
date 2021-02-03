import {
  createAsyncActionCreator,
  defaultAsyncReducer,
  defaultAsyncSaga,
  defaultAsyncState,
  IAsyncState,
  IAsyncStateVoid
} from '~/store/utils';
import {BigNumber, Signer} from 'ethers';
import {Action, createReducer, getType} from 'deox';
import {takeLatest} from 'redux-saga/effects';
import {HonestCasino} from '../../types/ethers-contracts';
import {selectCasinoSaga} from '~/store/registry';
import {
  claimReward,
  getGuessesToday,
  getMyRecentGuess,
  getMyRecentWin,
  getPrizeFund,
  getRecentWinners,
  ICasinoGuessReq,
  makeAGuess
} from '~/api/casino';
import {toast} from 'react-toastify';


export interface ICasinoWinEvent {
  player: string;
  number: number;
  prize: BigNumber;
  blockHash: string;
}

export interface ICasinoGuessEvent {
  number: number;
  bet: BigNumber;
  nonce: BigNumber;
  blockHash: string;
}

export interface ICasinoGuessReqExt {
  req: ICasinoGuessReq;
  signer: Signer;
}

export interface ICasinoState {
  prizeFund: IAsyncState<BigNumber>;
  guessesToday: IAsyncState<number>;
  recentWinners: IAsyncState<ICasinoWinEvent[]>;

  myRecentGuess: IAsyncState<ICasinoGuessEvent | null>;
  myRecentWin: IAsyncState<ICasinoWinEvent | null>;

  guess: IAsyncStateVoid;
  claimReward: IAsyncStateVoid;
}

export const defaultCasinoState: ICasinoState = {
  prizeFund: defaultAsyncState(),
  guessesToday: defaultAsyncState(),
  recentWinners: defaultAsyncState(),
  myRecentGuess: defaultAsyncState(),
  myRecentWin: defaultAsyncState(),

  guess: defaultAsyncState(),
  claimReward: defaultAsyncState()
};

export const casinoActions = {
  getPrizeFund: createAsyncActionCreator<void, BigNumber>('casino/get-prize-fund'),
  getGuessesToday: createAsyncActionCreator<void, number>('casino/get-guesses-today'),
  getRecentWinners: createAsyncActionCreator<void, ICasinoWinEvent[]>('casino/get-recent-winners'),

  getMyRecentGuess: createAsyncActionCreator<Signer, ICasinoGuessEvent | null>('casino/get-my-recent-guess'),
  getMyRecentWin: createAsyncActionCreator<Signer, ICasinoWinEvent | null>('casino/get-my-recent-win'),

  makeAGuess: createAsyncActionCreator<ICasinoGuessReqExt, void>('casino/make-a-guess'),
  claimReward: createAsyncActionCreator<Signer, void>('casino/claim-reward')
};

export const casinoReducer = createReducer(defaultCasinoState, h => [
  ...defaultAsyncReducer(h, casinoActions.getPrizeFund, 'prizeFund'),
  ...defaultAsyncReducer(h, casinoActions.getGuessesToday, 'guessesToday'),
  ...defaultAsyncReducer(h, casinoActions.getRecentWinners, 'recentWinners'),
  ...defaultAsyncReducer(h, casinoActions.getMyRecentGuess, 'myRecentGuess'),
  ...defaultAsyncReducer(h, casinoActions.getMyRecentWin, 'myRecentWin'),

  ...defaultAsyncReducer(h, casinoActions.makeAGuess, 'guess'),
  ...defaultAsyncReducer(h, casinoActions.claimReward, 'claimReward')
]);


function* getCasinoPrizeFundSaga() {
  const casino: HonestCasino = yield selectCasinoSaga();

  yield defaultAsyncSaga(casinoActions.getPrizeFund, () => getPrizeFund(casino));
}

function* getGuessesTodaySaga() {
  const casino: HonestCasino = yield selectCasinoSaga();

  yield defaultAsyncSaga(casinoActions.getGuessesToday, () => getGuessesToday(casino));
}

function* getRecentWinnersSaga() {
  const casino: HonestCasino = yield selectCasinoSaga();

  yield defaultAsyncSaga(casinoActions.getRecentWinners, () => getRecentWinners(casino));
}

function* getMyRecentGuessSaga(action: Action<string, Signer>) {
  const casino: HonestCasino = yield selectCasinoSaga();

  yield defaultAsyncSaga(casinoActions.getMyRecentGuess, () => getMyRecentGuess(casino, action.payload));
}

function* getMyRecentWinSaga(action: Action<string, Signer>) {
  const casino: HonestCasino = yield selectCasinoSaga();

  yield defaultAsyncSaga(casinoActions.getMyRecentWin, () => getMyRecentWin(casino, action.payload));
}

function* guessSaga(action: Action<string, ICasinoGuessReqExt>) {
  const casino: HonestCasino = yield selectCasinoSaga();

  yield defaultAsyncSaga(casinoActions.makeAGuess, async () => {
    await makeAGuess(casino, action.payload.signer, action.payload.req);
    toast.info('Your bet is placed!');
  });
}

function* claimRewardSaga(action: Action<string, Signer>) {
  const casino: HonestCasino = yield selectCasinoSaga();

  yield defaultAsyncSaga(casinoActions.claimReward, async () => {
    await claimReward(casino, action.payload);
    toast.success('Congratulations! Check your wallet balance.');
  });
}

export const casinoStateSagasConfig = [
  takeLatest(getType(casinoActions.getPrizeFund.start), getCasinoPrizeFundSaga),
  takeLatest(getType(casinoActions.getGuessesToday.start), getGuessesTodaySaga),
  takeLatest(getType(casinoActions.getRecentWinners.start), getRecentWinnersSaga),
  takeLatest(getType(casinoActions.getMyRecentGuess.start), getMyRecentGuessSaga),
  takeLatest(getType(casinoActions.getMyRecentWin.start), getMyRecentWinSaga),

  takeLatest(getType(casinoActions.makeAGuess.start), guessSaga),
  takeLatest(getType(casinoActions.claimReward.start), claimRewardSaga)
];