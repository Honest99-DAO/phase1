import {connectRouter, routerMiddleware, RouterState} from 'connected-react-router';
import {all} from 'redux-saga/effects';
import {createBrowserHistory} from 'history';
import {applyMiddleware, combineReducers, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import {composeWithDevTools} from 'redux-devtools-extension';
import {errorShowSagaConfig} from '~/store/utils';
import {IRegistryState, registryReducer, registryStateSagasConfig} from '~/store/registry';
import {casinoReducer, casinoStateSagasConfig, ICasinoState} from '~/store/casino';
import {IJoiTokenState, joiTokenReducer, joiTokenSagasConfig} from '~/store/joiToken';
import {accountantReducer, accountantSagasConfig, IAccountantState} from '~/store/accountant';
import {IVotingState, votingReducer, votingSagasConfig} from '~/store/voting';


export interface IAppState {
  router: RouterState;
  registry: IRegistryState;
  casino: ICasinoState;
  joiToken: IJoiTokenState;
  accountant: IAccountantState;
  voting: IVotingState;
}

function* rootSaga() {
  yield all([
    ...errorShowSagaConfig,
    ...registryStateSagasConfig,
    ...casinoStateSagasConfig,
    ...joiTokenSagasConfig,
    ...accountantSagasConfig,
    ...votingSagasConfig
  ]);
}

export const history = createBrowserHistory();

const rootReducer = combineReducers({
  router: connectRouter(history),
  registry: registryReducer,
  casino: casinoReducer,
  joiToken: joiTokenReducer,
  accountant: accountantReducer,
  voting: votingReducer
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