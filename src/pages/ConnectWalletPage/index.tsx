import {Fragment, h} from 'preact';
import styles from './index.scss';
import {cls, saveWalletId, WalletId} from '~/utils/common';
import {Button} from '~/components/Button';
import {toast} from 'react-toastify';
import {Icon} from '~/components/Icon';
import MetamaskIcon from '~/public/metamask.svg';
import WalletConnectIcon from '~/public/walletconnect.png';
import {useHistory} from 'react-router';
import {Loader} from '~/components/Loader';
import {Signer} from 'ethers';
import {useWeb3React} from '@web3-react/core';
import {AbstractConnector} from '@web3-react/abstract-connector';
import {injected, walletconnect} from '~/config';
import {useState} from 'preact/hooks';


export function ConnectWalletPage() {
  const web3React = useWeb3React<Signer>();
  const history = useHistory();
  const [loading, setLoading] = useState(false);

  const state = loading ? 'pending' : web3React.active ? 'active' : 'none';

  const connectWallet = async (connector: AbstractConnector, id: WalletId) => {
    setLoading(true);

    try {
      await web3React.activate(connector);
      saveWalletId(id);
      toast.success('Your wallet was connected!');
      history.goBack();

    } catch (e) {
      console.error(e);
      toast.error('Wallet was not connected! See console.');

    }
    setLoading(false);
  };

  const handleOnClickMetamask = async () => {
    await connectWallet(injected, 'injected');
  };

  const handleOnClickWalletConnect = async () => {
    await connectWallet(walletconnect, 'walletconnect');
  };

  const handleOnClickDisconnectWallet = async () => {
    web3React.deactivate();
    saveWalletId(null);
  }

  return (
    <div className={styles.connectWalletPage}>
      <div className={styles.content}>
        <h2>Connect your wallet</h2>

        {(() => {
          switch (state) {
            case 'pending':
              return <Loader className={styles.loader}/>;

            case 'none':
              return (
                <Fragment>
                  <Button
                    onClick={handleOnClickMetamask}
                    className={cls(styles.btn)}
                    icon={<Icon src={MetamaskIcon} className={styles.metamaskIcon}/>}
                  >
                    Connect Metamask
                  </Button>
                  <Button
                    onClick={handleOnClickWalletConnect}
                    className={cls(styles.btn)}
                    icon={<Icon src={WalletConnectIcon} className={styles.metamaskIcon}/>}
                  >
                    Use WalletConnect
                  </Button>
                </Fragment>
              );

            default:
              return (
                <Fragment>
                  <Button
                    onClick={() => history.goBack()}
                    className={cls(styles.btn)}
                  >
                    Continue
                  </Button>

                  <Button
                    onClick={handleOnClickDisconnectWallet}
                    className={cls(styles.btn)}
                  >
                    Disconnect wallet
                  </Button>
                </Fragment>
              );
          }
        })()
        }
      </div>
    </div>
  );
}