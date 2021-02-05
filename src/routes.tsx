import {history} from '~/store';
import {Redirect, Route, Switch} from 'react-router';
import {ConnectedRouter} from 'connected-react-router';
import {h} from 'preact';
import {CasinoRouterPage} from '~/pages/CasinoRouterPage';
import {CasinoDefaultPage} from '~/pages/CasinoDefaultPage';
import {ConnectWalletPage} from '~/pages/ConnectWalletPage';
import {useWeb3React} from '@web3-react/core';
import {Signer} from 'ethers';
import {restoreWalletId} from '~/utils/common';
import {injected, walletconnect} from '~/config';


export function Routes() {
  const web3React = useWeb3React<Signer>();
  const walletId = restoreWalletId();
  if (!web3React.active && walletId) {
    switch (walletId) {
      case 'injected':
        web3React.activate(injected)
          .then(() => console.log('Automatically restored injected wallet'))
          .catch((e) => console.error('Error during automatic wallet restore:', e));
        break;

      case 'walletconnect':
        web3React.activate(walletconnect)
          .then(() => console.log('Automatically restored injected wallet'))
          .catch((e) => console.error('Error durint automatic wallet restore:', e));
        break;

      default:
        console.error('Invalid wallet id - unable to automatically restore');
    }
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