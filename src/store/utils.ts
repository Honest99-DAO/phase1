import {Action, createActionCreator, getType} from 'deox';
import {toast} from 'react-toastify';
import {call, put, select, takeLatest} from 'redux-saga/effects';
import {CreateHandlerMap} from 'deox/dist/create-handler-map';
import {ExactActionCreator} from 'deox/dist/create-action-creator';
import {IAppState} from '~/store';
import {useDispatch, useSelector} from 'react-redux';
import {Inputs, useEffect} from 'preact/hooks';
import {useWallet} from 'use-wallet';
import {providers, Signer} from 'ethers';
import {useWeb3React} from '@web3-react/core';


export const errorShowAction = createActionCreator('error/show', r => (e: Error) => r(e));

function* errorShowSaga(action: Action<string, Error>) {
  console.error(action.payload);
  toast.error(action.payload.message);
}

export const errorShowSagaConfig = [
  takeLatest(getType(errorShowAction), errorShowSaga)
];

export interface IAsyncActions<REQ, RES> {
  start: ExactActionCreator<string, (req: REQ) => Action<string, REQ>>,
  success: ExactActionCreator<string, (req: RES) => Action<string, RES>>,
  fail: ExactActionCreator<string, (req: Error) => Action<string, Error>>
}

export function createAsyncActionCreator<REQ, RES>(type: string): IAsyncActions<REQ, RES> {
  return {
    start: createActionCreator(`${type}-start`, r => (req: REQ) => r(req)),
    success: createActionCreator(`${type}-success`, r => (res: RES) => r(res)),
    fail: createActionCreator(`${type}-fail`, r => (err: Error) => r(err))
  };
}

export interface IAsyncStateVoid {
  fetching: boolean;
  error: Error | null;
}

export interface IAsyncState<T> extends IAsyncStateVoid {
  data: T | null;
}

export function defaultAsyncState<T>(state: Partial<IAsyncState<T>> | void): IAsyncState<T> {
  const defaultState = {
    data: null,
    fetching: false,
    error: null
  };

  if (!state) return defaultState;

  return {...defaultState, ...state};
}

export function defaultAsyncStartReducer<STATE, REQ, RES>(
  h: CreateHandlerMap<STATE>,
  actionSet: IAsyncActions<REQ, RES>,
  key: keyof STATE
) {
  return h(actionSet.start, (state): STATE => ({
    ...state,
    [key]: defaultAsyncState({fetching: true})
  }));
}

export function defaultAsyncSuccessReducer<STATE, REQ, RES>(
  h: CreateHandlerMap<STATE>,
  actionSet: IAsyncActions<REQ, RES>,
  key: keyof STATE
) {
  return h(actionSet.success, (state, action: { type: string, payload: RES }): STATE => ({
    ...state,
    [key]: defaultAsyncState({data: action.payload})
  }));
}

export function defaultAsyncFailReducer<STATE, REQ, RES>(
  h: CreateHandlerMap<STATE>,
  actionSet: IAsyncActions<REQ, RES>,
  key: keyof STATE
) {
  return h(actionSet.fail, (state, {payload: error}): STATE => ({
    ...state,
    [key]: defaultAsyncState({error})
  }));
}

export function defaultAsyncReducer<STATE, REQ, RES>(
  h: CreateHandlerMap<STATE>,
  actionSet: IAsyncActions<REQ, RES>,
  key: keyof STATE
) {
  return [
    defaultAsyncStartReducer(h, actionSet, key),
    defaultAsyncSuccessReducer(h, actionSet, key),
    defaultAsyncFailReducer(h, actionSet, key)
  ];
}

export function* defaultAsyncSaga<REQ, RES>(
  actionSet: IAsyncActions<REQ, RES>,
  fn: () => Promise<RES>
) {
  try {
    const res: RES = yield call(fn);

    yield put(actionSet.success(res));
  } catch (e) {
    yield putErr(actionSet.fail(e));
  }
}

export function* lazyLoadSelectSaga<T>(selector: (state: IAppState) => T, fallback: () => any) {
  let res = yield select(selector);

  if (res == null) {
    yield call(fallback);
    res = yield select(selector);
  }

  return res;
}

// only use it on a leaf of IAsyncState
export function useDefaultAsyncLazyLoadSelector<REQ, RES>(
  selector: (state: IAppState) => IAsyncState<RES>,
  startAction: Action<string, REQ> | null,
  inputs: Inputs = []
): IAsyncState<RES> {
  const dispatch = useDispatch();
  const selected = useSelector(selector);

  useEffect(() => {
    if (selected.data == null) {
      if (startAction != null) {
        dispatch(startAction);
      }
    }
  }, inputs);

  return selected;
}

export function useSigner(): Signer | null {
  const web3React = useWeb3React<Signer>();

  return web3React.library || null;
}

export function* putErr(action: Action<string, Error>) {
  yield put(action);
  yield put(errorShowAction(action.payload));
}

export const ERROR_WALLET_NOT_FOUND = new Error('Web3 wallet not found');
