import {Fragment, h} from 'preact';
import styles from './index.scss';
import {cls} from '~/utils/common';
import {Button} from '~/components/Button';
import {toast} from 'react-toastify';
import {Icon} from '~/components/Icon';
import MetamaskIcon from '~/public/metamask.svg';
import WalletConnectIcon from '~/public/walletconnect.png';
import {useHistory} from 'react-router';
import {Loader} from '~/components/Loader';
import {Signer} from 'ethers';
import {useWeb3React} from '@web3-react/core';
import {injected, walletconnect} from '~/config';
import {useState} from 'preact/hooks';


export function ConnectWalletPage() {
  const web3React = useWeb3React<Signer>();
  const history = useHistory();
  const [loading, setLoading] = useState(false);

  const state = loading ? 'pending' : web3React.active ? 'active' : 'none';

  const handleOnClickMetamask = async () => {
    setLoading(true);

    try {
      await web3React.activate(injected);
      toast.success('Your wallet was connected!');
      history.goBack();

    } catch (e) {
      console.error(e);
      toast.error('Wallet was not connected! See console.');

    }
    setLoading(false);
  };

  const handleOnClickWalletConnect = async () => {
    setLoading(true);

    try {
      await web3React.activate(walletconnect);
      toast.success('Your wallet was connected!');
      history.goBack();

    } catch (e) {
      console.error(e);
      toast.error('Wallet was not connected! See console.');

    }
    setLoading(false);
  };

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
                <Button
                  onClick={() => history.goBack()}
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