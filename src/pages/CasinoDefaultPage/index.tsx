import {Fragment, h} from 'preact';
import styles from './index.scss';
import {Button} from '~/components/Button';
import {CONFIG} from '~/config';
import {Link, useHistory} from 'react-router-dom';
import {cls, linkToContract} from '~/utils/common';
import {useDefaultAsyncLazyLoadSelector, useSigner} from '~/store/utils';
import {casinoActions} from '~/store/casino';


export function CasinoDefaultPage() {
  const history = useHistory();
  const signer = useSigner();

  const prizeMultiplier = useDefaultAsyncLazyLoadSelector(
    state => state.casino.prizeMultiplier,
    casinoActions.getPrizeMultiplier.start()
  );

  const handleOnClickContinue = () => {
    history.push('/casino/dashboard/guess');
  };

  const handleOnClickConnectWallet = () => {
    history.push('/connect-wallet');
  };

  return (
    <div className={styles.defaultPage}>
      <h1>Casino 'Honest 99'</h1>

      <div className={styles.rules}>
        <p>Bet <i>ETH</i> on any number between <b>0</b> and <b>99</b></p>
        <p>If your guess was correct, you get <b>x{prizeMultiplier.data ? prizeMultiplier.data : 'N'}</b> of your bet</p>
        <p>Max prize is <b>200</b> <i>ETH</i> <br/> (but no more than a half of the prize fund)</p>
        <p><b>1%</b> fee of each bet goes to <Link to='/dao'>phase 2 funding</Link></p>
        <p>If your guess was wrong, you lose your <i>ETH</i></p>
      </div>

      <p>
        <br/> <br/> No lies, check yourself <br/>

        <a href={linkToContract(CONFIG.casinoContractAddress)} target='_blank'>etherscan</a>
        , <a href={CONFIG.mainGithubUrl} target='_blank'>github</a>
        , <a href={CONFIG.discussionUrl} target='_blank'>telegram</a>
      </p>

      <div className={styles.buttonsWrapper}>
        {
          signer
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