import {Fragment, h} from 'preact';
import styles from './index.scss';
import {cls, setWalletConnected} from '~/utils/common';
import {Button} from '~/components/Button';
import {toast} from 'react-toastify';
import {useWallet} from 'use-wallet';
import {Icon} from '~/components/Icon';
import MetamaskIcon from '~/public/metamask.svg';
import WalletConnectIcon from '~/public/walletconnect.png';
import {useHistory} from 'react-router';
import {Loader} from '~/components/Loader';


export function ConnectWalletPage() {
  const wallet = useWallet();
  const history = useHistory();

  const handleOnClickMetamask = async () => {
    try {
      await wallet.connect('injected');
    } catch (e) {
      console.error(e);
    } finally {
      handleWalletStatus('injected');
    }
  };

  const handleWalletStatus = (type: typeof wallet.connector) => {
    if (wallet.status == 'connected') {
      setWalletConnected(type);
      toast.success('Your wallet was connected!');

      history.goBack();
    } else {
      setWalletConnected(null);
      toast.error('Wallet was not connected! See console.')

      history.push('/');
      console.error(wallet.error);
    }
  };

  return (
    <div className={styles.connectWalletPage}>
      <div className={styles.content}>
        <h2>Connect your wallet</h2>

        {(() => {
          switch (wallet.status) {
            case 'connecting':
              return <Loader className={styles.loader}/>;

            case 'disconnected':
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
                    onClick={handleOnClickMetamask}
                    className={cls(styles.btn)}
                    icon={<Icon src={WalletConnectIcon} className={styles.metamaskIcon}/>}
                  >
                    Use WalletConnect
                  </Button>
                </Fragment>
              );

            default:
              return (
                <Button
                  onClick={() => handleWalletStatus(wallet.connector)}
                  className={cls(styles.btn)}
                >
                  Continue
                </Button>
              );
          }
        })()
        }
      </div>
    </div>
  );
}