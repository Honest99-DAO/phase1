import {Fragment, h} from 'preact';
import styles from './index.scss';
import {Button} from '~/components/Button';
import {CONFIG} from '~/config';
import {Link, useHistory} from 'react-router-dom';
import {cls, EtherUnit} from '~/utils/common';
import {useWallet} from 'use-wallet';


export function DaoDefaultPage() {
  const history = useHistory();
  const wallet = useWallet();

  const handleOnClickContinue = () => {
    history.push('/dao/dashboard/token');
  };

  const handleOnClickConnectWallet = () => {
    history.push('/connect-wallet');
  };

  return (
    <div className={styles.defaultPage}>
      <div className={styles.header}>
        <h1>Honest casino</h1>
        <h2>DAO</h2>
      </div>

      <div className={styles.rules}>
        <p>Get <b>Joi</b> tokens - shares of the DAO</p>
        <p>Receive dividends in <i>{EtherUnit.ETHER}</i> monthly</p>
        <p>Participate votings or start your own</p>
        <p>
          More <b>Joi</b>s you have, more dividends you receive and more voting power you have
        </p>
        <p>
          We’re the DAO, we are all responsible: <br/>
          promote <Link to='/'>the casino</Link>,
          improve <a target='_blank' href={CONFIG.mainGithubUrl}>the codebase</a> or find another way to help
        </p>
      </div>

      <p>Come <b>Joi</b>n us</p>

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
                <p>or <Link to='/dao/dashboard/token'>continue</Link> in read-only mode</p>
              </Fragment>
            )
        }
      </div>
    </div>
  );
}