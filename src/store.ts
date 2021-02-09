import {connectRouter, routerMiddleware, RouterState} from 'connected-react-router';
import {all} from 'redux-saga/effects';
import {createHashHistory} from 'history';
import {applyMiddleware, combineReducers, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import {composeWithDevTools} from 'redux-devtools-extension';
import {errorShowSagaConfig} from '~/store/utils';
import {casinoReducer, casinoStateSagasConfig, ICasinoState} from '~/store/casino';


export interface IAppState {
  router: RouterState;
  casino: ICasinoState;
}

function* rootSaga() {
  yield all([
    ...errorShowSagaConfig,
    ...casinoStateSagasConfig,
  ]);
}

export const history = createHashHistory();

const rootReducer = combineReducers({
  router: connectRouter(history),
  casino: casinoReducer,
});

const sagaMiddleware = createSagaMiddleware();
const routingMiddleware = routerMiddleware(history);

export const store = createStore(
  rootReducer,
  composeWithDevTools(
    applyMiddleware(sagaMiddleware),
    applyMiddleware(routingMiddleware)
  )
);
sagaMiddleware.run(rootSaga);