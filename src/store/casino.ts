import {
  createAsyncActionCreator, defaultAsyncFailReducer,
  defaultAsyncReducer,
  defaultAsyncSaga,
  defaultAsyncState, defaultAsyncSuccessReducer,
  IAsyncState,
  IAsyncStateVoid, putErr
} from '~/store/utils';
import {BigNumber, ContractTransaction, Signer} from 'ethers';
import {Action, createActionCreator, createReducer, getType} from 'deox';
import {call, put, takeLatest} from 'redux-saga/effects';
import {
  BlockNumberChannel,
  claimReward,
  getCurrentBlockNumber,
  getGuessesToday,
  getMyRecentGuess,
  getMyRecentWin,
  getPrizeFund,
  getPrizeMultiplier,
  getRecentWinners,
  GuessesChannel,
  makeAGuess,
  PrizeClaimsChannel,
  PrizeFundChannel,
  PrizeMultiplierChannel,
  setupGuessesListener,
  setupPrizeClaimsListener
} from '~/api/casino';
import {toast} from 'react-toastify';
import {push} from 'connected-react-router';
import {parseGuess} from '~/utils/model';


export interface ICasinoGuessReq {
  bet: BigNumber;
  number: number;
}

export interface ICasinoWinEvent {
  player: string;
  number: number;
  prize: BigNumber;
  txnHash: string;
  nonce: number;
}

export interface IGuess {
  sender: string;
  bet: BigNumber;
  number: number;
  randomNumber: number;
  txnHash: string;
  blockNumber: number;
  nonce: number;
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

  myRecentGuess: IAsyncState<IGuess | null>;
  myRecentWin: IAsyncState<ICasinoWinEvent | null>;

  currentBlockNumber: IAsyncState<number>;

  guess: IAsyncState<IGuess> & {pendingGuessNumber: number};
  claimReward: IAsyncStateVoid;
}

export const defaultCasinoState: ICasinoState = {
  prizeFund: defaultAsyncState(),
  guessesToday: defaultAsyncState(),
  recentWinners: defaultAsyncState(),
  prizeMultiplier: defaultAsyncState(),
  myRecentGuess: defaultAsyncState(),
  myRecentWin: defaultAsyncState(),
  currentBlockNumber: defaultAsyncState(),

  guess: {
    ...defaultAsyncState(),
    pendingGuessNumber: -1
  },
  claimReward: defaultAsyncState()
};

export const casinoActions = {
  getPrizeFund: createAsyncActionCreator<void, BigNumber>('casino/get-prize-fund'),
  getGuessesToday: createAsyncActionCreator<void, number>('casino/get-guesses-today'),
  incGuessesToday: createActionCreator('casino/inc-guesses-today'),
  getRecentWinners: createAsyncActionCreator<void, ICasinoWinEvent[]>('casino/get-recent-winners'),
  pushRecentWinner: createActionCreator('casino/push-recent-winner', r => (ev: ICasinoWinEvent) => r(ev)),
  getPrizeMultiplier: createAsyncActionCreator<void, number>('casino/get-prize-multiplier'),

  getMyRecentGuess: createAsyncActionCreator<Signer, IGuess | null>('casino/get-my-recent-guess'),
  getMyRecentWin: createAsyncActionCreator<Signer, ICasinoWinEvent | null>('casino/get-my-recent-win'),
  getCurrentBlockNumber: createAsyncActionCreator<void, number>('casino/get-current-block-number'),

  makeAGuess: createAsyncActionCreator<ICasinoGuessReqExt, IGuess>('casino/make-a-guess'),
  claimReward: createAsyncActionCreator<Signer, void>('casino/claim-reward')
};

export const casinoReducer = createReducer(defaultCasinoState, h => [
  ...defaultAsyncReducer(h, casinoActions.getPrizeFund, 'prizeFund'),
  ...defaultAsyncReducer(h, casinoActions.getGuessesToday, 'guessesToday'),
  h(casinoActions.incGuessesToday, (state: ICasinoState): ICasinoState => ({
    ...state,
    guessesToday: {
      ...state.guessesToday,
      data: state.guessesToday.data ? state.guessesToday.data + 1 : null
    }
  })),
  ...defaultAsyncReducer(h, casinoActions.getRecentWinners, 'recentWinners'),
  ...defaultAsyncReducer(h, casinoActions.getPrizeMultiplier, 'prizeMultiplier'),
  ...defaultAsyncReducer(h, casinoActions.getMyRecentGuess, 'myRecentGuess'),
  ...defaultAsyncReducer(h, casinoActions.getMyRecentWin, 'myRecentWin'),
  ...defaultAsyncReducer(h, casinoActions.getCurrentBlockNumber, 'currentBlockNumber'),

  ...[
    h(casinoActions.makeAGuess.start, (state, action: { type: string, payload: ICasinoGuessReqExt }): ICasinoState => ({
      ...state,
      guess: {
        ...defaultAsyncState({fetching: true}),
        pendingGuessNumber: action.payload.req.number
      }
    })),
    defaultAsyncSuccessReducer(h, casinoActions.makeAGuess, 'guess'),
    defaultAsyncFailReducer(h, casinoActions.makeAGuess, 'guess')
  ],
  ...defaultAsyncReducer(h, casinoActions.claimReward, 'claimReward')
]);


function* getCasinoPrizeFundSaga() {
  yield defaultAsyncSaga(casinoActions.getPrizeFund, getPrizeFund);

  const read = PrizeFundChannel.read();

  while (true) {
    const prizeFund: BigNumber = yield call(read);
    yield put(casinoActions.getPrizeFund.success(prizeFund));
  }
}

function* getPrizeMultiplierSaga() {
  yield defaultAsyncSaga(casinoActions.getPrizeMultiplier, getPrizeMultiplier);

  const read = PrizeMultiplierChannel.read();

  while (true) {
    const prizeMultiplier: number = yield call(read);
    yield put(casinoActions.getPrizeMultiplier.success(prizeMultiplier));
  }
}

function* getCurrentBlockNumberSaga() {
  yield defaultAsyncSaga(casinoActions.getCurrentBlockNumber, getCurrentBlockNumber);

  const read = BlockNumberChannel.read();

  while (true) {
    const blockNumber: number = yield call(read);
    yield put(casinoActions.getCurrentBlockNumber.success(blockNumber));
  }
}

function* getGuessesTodaySaga() {
  yield defaultAsyncSaga(casinoActions.getGuessesToday, getGuessesToday);
  setupGuessesListener();

  const read = GuessesChannel.read();

  while (true) {
    yield call(read);
    yield put(casinoActions.incGuessesToday());
  }
}

function* getMyRecentGuessSaga(action: Action<string, Signer>) {
  yield defaultAsyncSaga(casinoActions.getMyRecentGuess, () => getMyRecentGuess(action.payload));
  setupGuessesListener();

  const read = GuessesChannel.read();
  const address = yield call(() => action.payload.getAddress());

  while (true) {
    const event: IGuess = yield call(read);

    if (event.sender == address) {
      yield put(casinoActions.getMyRecentGuess.success(event))
    }
  }
}

function* getRecentWinnersSaga() {
  yield defaultAsyncSaga(casinoActions.getRecentWinners, getRecentWinners);
  setupPrizeClaimsListener();

  const read = PrizeClaimsChannel.read();

  while (true) {
    const event: ICasinoWinEvent = yield call(read);
    yield put(casinoActions.pushRecentWinner(event));
  }
}

function* getMyRecentWinSaga(action: Action<string, Signer>) {
  yield defaultAsyncSaga(casinoActions.getMyRecentWin, () => getMyRecentWin(action.payload));
  setupPrizeClaimsListener();

  const read = PrizeClaimsChannel.read();
  const address: string = yield call(() => action.payload.getAddress());

  while (true) {
    const event: ICasinoWinEvent = yield call(read);

    if (event.player == address) {
      yield put(casinoActions.getMyRecentWin.success(event));
    }
  }
}


function* guessSaga(action: Action<string, ICasinoGuessReqExt>) {
  try {
    const tx: ContractTransaction = yield call(makeAGuess, action.payload.signer, action.payload.req);

    yield put(push('/casino/dashboard/result'))

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
  takeLatest(getType(casinoActions.getCurrentBlockNumber.start), getCurrentBlockNumberSaga),

  takeLatest(getType(casinoActions.makeAGuess.start), guessSaga),
  takeLatest(getType(casinoActions.claimReward.start), claimRewardSaga)
];