import {history} from '~/store';
import {Redirect, Route, Switch} from 'react-router';
import {ConnectedRouter} from 'connected-react-router';
import {h} from 'preact';
import {CasinoRouterPage} from '~/pages/CasinoRouterPage';
import {CasinoDefaultPage} from '~/pages/CasinoDefaultPage';
import {ConnectWalletPage} from '~/pages/ConnectWalletPage';
import {useWeb3React} from '@web3-react/core';
import {Signer} from 'ethers';
import {CONFIG, injected, walletconnect} from '~/config';
import {useEffect, useState} from 'preact/hooks';
import {Loader} from '~/components/Loader';
import {restoreWalletId} from '~/utils/model';
import {reInitCasino} from '~/api/casino';
import {useSigner} from '~/store/utils';
import {useDispatch} from 'react-redux';
import {casinoActions} from '~/store/casino';


let account: string | null | undefined;

export function Routes() {
  const web3React = useWeb3React<Signer>();
  const walletId = restoreWalletId();
  let promise: Promise<void> | null = null;

  if (!web3React.active && walletId) {
    switch (walletId) {
      case 'injected':
        promise = web3React.activate(injected);
        break;

      case 'walletconnect':
        promise = web3React.activate(walletconnect);
        break;

      default:
        console.error('Invalid wallet id - unable to automatically restore');
    }
  }

  const [showLoader, setShowLoader] = useState(!!promise);

  promise
    ?.then(() => console.log('Automatically restored injected wallet'))
    .catch((e) => console.error('Error during automatic wallet restore:', e))
    .finally(() => setShowLoader(false));

  // events don't work as expected - workaround
  useEffect(() => {
    if (web3React.account) {
      if (!account) account = web3React.account;
      else if (account != web3React.account) window.location.reload();
    }
  }, [web3React.account]);

  const dispatch = useDispatch();
  const signer = useSigner();

  useEffect(() => {
    if (web3React.chainId) {
      dispatch(casinoActions.updateChainId(web3React.chainId));

      console.log('Working with user provider');
      reInitCasino(web3React.chainId, signer);
    } else {
      console.log('Working with default provider');
      reInitCasino(CONFIG.chainId!, null);
    }
  }, [web3React.chainId, signer]);

  return (
    showLoader
      ? <Loader style={{width: '50px', position: 'absolute', top: '50px', left: '50%', right: '50%'}}/>
      : (
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
      )
  );
}