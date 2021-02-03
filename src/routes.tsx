import {history} from '~/store';
import {Redirect, Route, Switch} from 'react-router';
import {DaoDefaultPage} from '~/pages/DaoDefaultPage';
import {DaoRouterPage} from '~/pages/DaoRouterPage';
import {ConnectedRouter} from 'connected-react-router';
import {h} from 'preact';
import {isWalletConnected} from '~/utils/common';
import {useWallet} from 'use-wallet';
import {CasinoRouterPage} from '~/pages/CasinoRouterPage';
import {CasinoDefaultPage} from '~/pages/CasinoDefaultPage';
import {ConnectWalletPage} from '~/pages/ConnectWalletPage';


export function Routes() {
  const connectedId = isWalletConnected();
  const wallet = useWallet();
  if (wallet.status == 'disconnected' && connectedId != null) {
    wallet.connect(connectedId)
  }

  return (
    <ConnectedRouter history={history}>
      <Switch>
        <Route
          path='/'
          exact
          render={() => <CasinoDefaultPage/>}
        />
        <Route
          path='/casino/dashboard'
          render={() => <CasinoRouterPage/>}
        />
        <Route
          path='/dao'
          exact
          render={() => <DaoDefaultPage/>}
        />
        <Route
          path='/dao/dashboard'
          render={() => <DaoRouterPage/>}
        />
        <Route
          path='/connect-wallet'
          render={() => <ConnectWalletPage/>}
        />
        <Route
          path='/404'
          render={() =>
            <h1 style={{width: '100%', fontSize: '110px', textAlign: 'center', lineHeight: '100vh'}}>404</h1>
          }
        />
        <Redirect to='/404'/>
      </Switch>
    </ConnectedRouter>
  );
}