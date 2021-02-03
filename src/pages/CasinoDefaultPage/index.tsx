import {Fragment, h} from 'preact';
import styles from './index.scss';
import {Button} from '~/components/Button';
import {CONFIG} from '~/config';
import {Link, useHistory} from 'react-router-dom';
import {cls, EtherUnit, linkToContract} from '~/utils/common';
import {useDefaultAsyncLazyLoadSelector} from '~/store/utils';
import {registryActions} from '~/store/registry';
import {useWallet} from "use-wallet";


export function CasinoDefaultPage() {
  const history = useHistory();
  const wallet = useWallet();
  const registryCasinoContract = useDefaultAsyncLazyLoadSelector(
    state => state.registry.casinoRO,
    registryActions.getCasino.start()
  );

  const handleOnClickContinue = () => {
    history.push('/casino/dashboard/guess');
  };

  const handleOnClickConnectWallet = () => {
    history.push('/connect-wallet');
  };

  return (
    <div className={styles.defaultPage}>
      <h1>Honest casino</h1>

      <div className={styles.rules}>
        <p>Bet <i>{EtherUnit.ETHER}</i> on any number between <b>0</b> and <b>99</b></p>
        <p>Press <b>Make a guess</b></p>
        <p>If your guess was correct, you get <b>x10</b> of your bet</p>
        <p>Max bet is <b>20</b> <i>{EtherUnit.ETHER}</i></p>
        <p><b>1%</b> fee of each bet goes to <Link to='/dao'>the DAO</Link></p>
        <p>If your guess was wrong, you lose your <i>{EtherUnit.ETHER}</i></p>
      </div>

      <p>
        <br/> <br/> No jokes, no lies, no bullshit <br/>
        {
          registryCasinoContract.data && (
            <Fragment>
              <a href={linkToContract(registryCasinoContract.data!.address)} target='_blank'>etherscan</a>
              , <a href={CONFIG.mainGithubUrl} target='_blank'>github</a>
            </Fragment>
          )
        }
      </p>

      <div className={styles.buttonsWrapper}>
        {
          wallet.status == 'connected'
            ? (
              <Button
                onClick={handleOnClickContinue}
                className={cls(styles.btn)}
              >
                Continue
              </Button>
            )
            : (
              <Fragment>
                <Button
                  onClick={handleOnClickConnectWallet}
                  className={cls(styles.btn)}
                >
                  Connect wallet
                </Button>
                <p>or <Link to='/casino/dashboard/guess'>continue</Link> in read-only mode</p>
              </Fragment>
            )
        }
      </div>
    </div>
  );
}