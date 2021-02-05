import {
  createAsyncActionCreator,
  defaultAsyncReducer,
  defaultAsyncSaga,
  defaultAsyncState,
  IAsyncState,
  IAsyncStateVoid, putErr
} from '~/store/utils';
import {BigNumber, ContractTransaction, Signer} from 'ethers';
import {Action, createReducer, getType} from 'deox';
import {call, put, takeLatest} from 'redux-saga/effects';
import {
  claimReward,
  getGuessesToday,
  getMyRecentGuess,
  getMyRecentWin,
  getPrizeFund, getPrizeMultiplier,
  getRecentWinners,
  ICasinoGuessReq,
  makeAGuess
} from '~/api/casino';
import {toast} from 'react-toastify';
import {IGuess, parseGuess, saveGuessNumber} from '~/utils/common';
import {push} from 'connected-react-router';


export interface ICasinoWinEvent {
  player: string;
  number: number;
  prize: BigNumber;
  txnHash: string;
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
  prizeMultiplier: IAsyncState<number>;

  myRecentGuess: IAsyncState<ICasinoGuessEvent | null>;
  myRecentWin: IAsyncState<ICasinoWinEvent | null>;

  guess: IAsyncState<IGuess>;
  claimReward: IAsyncStateVoid;
}

export const defaultCasinoState: ICasinoState = {
  prizeFund: defaultAsyncState(),
  guessesToday: defaultAsyncState(),
  recentWinners: defaultAsyncState(),
  prizeMultiplier: defaultAsyncState(),
  myRecentGuess: defaultAsyncState(),
  myRecentWin: defaultAsyncState(),

  guess: defaultAsyncState(),
  claimReward: defaultAsyncState()
};

export const casinoActions = {
  getPrizeFund: createAsyncActionCreator<void, BigNumber>('casino/get-prize-fund'),
  getGuessesToday: createAsyncActionCreator<void, number>('casino/get-guesses-today'),
  getRecentWinners: createAsyncActionCreator<void, ICasinoWinEvent[]>('casino/get-recent-winners'),
  getPrizeMultiplier: createAsyncActionCreator<void, number>('casino/get-prize-multiplier'),

  getMyRecentGuess: createAsyncActionCreator<Signer, ICasinoGuessEvent | null>('casino/get-my-recent-guess'),
  getMyRecentWin: createAsyncActionCreator<Signer, ICasinoWinEvent | null>('casino/get-my-recent-win'),

  makeAGuess: createAsyncActionCreator<ICasinoGuessReqExt, IGuess>('casino/make-a-guess'),
  claimReward: createAsyncActionCreator<Signer, void>('casino/claim-reward')
};

export const casinoReducer = createReducer(defaultCasinoState, h => [
  ...defaultAsyncReducer(h, casinoActions.getPrizeFund, 'prizeFund'),
  ...defaultAsyncReducer(h, casinoActions.getGuessesToday, 'guessesToday'),
  ...defaultAsyncReducer(h, casinoActions.getRecentWinners, 'recentWinners'),
  ...defaultAsyncReducer(h, casinoActions.getPrizeMultiplier, 'prizeMultiplier'),
  ...defaultAsyncReducer(h, casinoActions.getMyRecentGuess, 'myRecentGuess'),
  ...defaultAsyncReducer(h, casinoActions.getMyRecentWin, 'myRecentWin'),

  ...defaultAsyncReducer(h, casinoActions.makeAGuess, 'guess'),
  ...defaultAsyncReducer(h, casinoActions.claimReward, 'claimReward')
]);


function* getCasinoPrizeFundSaga() {
  yield defaultAsyncSaga(casinoActions.getPrizeFund, getPrizeFund);
}

function* getGuessesTodaySaga() {
  yield defaultAsyncSaga(casinoActions.getGuessesToday, getGuessesToday);
}

function* getRecentWinnersSaga() {
  yield defaultAsyncSaga(casinoActions.getRecentWinners, getRecentWinners);
}

function* getPrizeMultiplierSaga() {
  yield defaultAsyncSaga(casinoActions.getPrizeMultiplier, getPrizeMultiplier);
}

function* getMyRecentGuessSaga(action: Action<string, Signer>) {
  yield defaultAsyncSaga(casinoActions.getMyRecentGuess, () => getMyRecentGuess(action.payload));
}

function* getMyRecentWinSaga(action: Action<string, Signer>) {
  yield defaultAsyncSaga(casinoActions.getMyRecentWin, () => getMyRecentWin(action.payload));
}

function* guessSaga(action: Action<string, ICasinoGuessReqExt>) {
  try {
    const tx: ContractTransaction = yield call(makeAGuess, action.payload.signer, action.payload.req);

    saveGuessNumber(action.payload.req.number);
    yield put(push('/casino/dashboard/result/from-guess'))

    const rec = yield call(() => tx.wait());

    const guess = parseGuess(rec)

    if (guess.number == guess.randomNumber) {
      toast.success('Numbers match! Claim your prize')
    } else {
      toast.info('Numbers don\'t match :C');
    }

    yield put(casinoActions.makeAGuess.success(guess));
  } catch (e) {
    yield putErr(casinoActions.makeAGuess.fail(e));
  }
}

function* claimRewardSaga(action: Action<string, Signer>) {
  yield defaultAsyncSaga(casinoActions.claimReward, async () => {
    await claimReward(action.payload);
    toast.success('Congratulations! Check your wallet balance.');
  });
}

export const casinoStateSagasConfig = [
  takeLatest(getType(casinoActions.getPrizeFund.start), getCasinoPrizeFundSaga),
  takeLatest(getType(casinoActions.getGuessesToday.start), getGuessesTodaySaga),
  takeLatest(getType(casinoActions.getRecentWinners.start), getRecentWinnersSaga),
  takeLatest(getType(casinoActions.getPrizeMultiplier.start), getPrizeMultiplierSaga),
  takeLatest(getType(casinoActions.getMyRecentGuess.start), getMyRecentGuessSaga),
  takeLatest(getType(casinoActions.getMyRecentWin.start), getMyRecentWinSaga),

  takeLatest(getType(casinoActions.makeAGuess.start), guessSaga),
  takeLatest(getType(casinoActions.claimReward.start), claimRewardSaga)
];