import {Fragment, h} from 'preact';
import styles from './index.scss';
import {Button} from '~/components/Button';
import {NumberBar} from '~/components/NumberBar';
import {useHistory} from 'react-router';
import {useDefaultAsyncLazyLoadSelector, useSigner} from '~/store/utils';
import {casinoActions} from '~/store/casino';
import {useDispatch, useSelector} from 'react-redux';
import {IAppState} from '~/store';
import {shrinkUnits} from '~/utils/common';
import {Loader} from '~/components/Loader';
import {formatEther} from 'ethers/lib/utils';
import {useEffect} from 'preact/hooks';
import {toast} from 'react-toastify';


export function CasinoResultPage() {
  const history = useHistory();
  const dispatch = useDispatch();
  const signer = useSigner();

  if (!signer) {
    toast.error('Wallet not connected');
    history.push('/connect-wallet');

    return null;
  }

  const prizeMultiplier = useDefaultAsyncLazyLoadSelector(
    state => state.casino.prizeMultiplier,
    casinoActions.getPrizeMultiplier.start()
  );

  const currentBlockNumber = useDefaultAsyncLazyLoadSelector(
    state => state.casino.currentBlockNumber,
    casinoActions.getCurrentBlockNumber.start()
  );

  const pendingGuess = useSelector((state: IAppState) => state.casino.guess);
  const pendingGuessNumber = useSelector((state: IAppState) => state.casino.guess.pendingGuessNumber);

  const recentGuess = useSelector((state: IAppState) => state.casino.myRecentGuess);
  useEffect(() => {
    if (pendingGuessNumber == -1 && recentGuess.data == null) {
      dispatch(casinoActions.getMyRecentGuess.start(signer));
    }
  }, []);

  const recentWin = useSelector((state: IAppState) => state.casino.myRecentWin);
  useEffect(() => {
    if (pendingGuessNumber == -1 && recentWin.data == null) {
      dispatch(casinoActions.getMyRecentWin.start(signer));
    }
  }, []);

  const handleOnClaimPrizeClick = () => {
    dispatch(casinoActions.claimReward.start(signer));
  };

  const guess = pendingGuessNumber != -1 ? pendingGuess : recentGuess;
  const hasUnclaimedPrize = (pendingGuessNumber != -1 && pendingGuess.data && (pendingGuess.data.number == pendingGuess.data.randomNumber))
    || (recentGuess.data && recentWin.data && recentGuess.data.number == recentGuess.data.randomNumber && recentGuess.data.nonce != recentWin.data.nonce);

  const timeLeft = currentBlockNumber.data && guess.data
    ? 255 - (currentBlockNumber.data - guess.data.blockNumber)
    : 0;
  const timeLeftLabel = timeLeft > 0
    ? <i>Hurry up! <b>~{timeLeft * 15 / 60}</b> minutes left</i>
    : <i>Too late, time's up :c</i>;

  const tryAgainBtnDisabled = (hasUnclaimedPrize && timeLeft > 0) || (pendingGuessNumber != -1 && guess.fetching);

  return (
    <div className={styles.guessResultPage}>
      {
        pendingGuessNumber == -1 && guess.fetching
          ? <Loader className={styles.loader}/>
          : pendingGuessNumber == -1 && guess.data == null
          ? <p>You didn't make any guess yet</p>
          : (
            <Fragment>
              <div className={styles.guess}>
                <h2>Your guess</h2>
                <p>{pendingGuessNumber != -1 ? pendingGuessNumber : guess.data!.number}</p>
              </div>

              <div className={styles.result}>
                <h2>The number is</h2>
                <NumberBar number={guess.data?.randomNumber} min={0} max={100}/>
              </div>

              {
                prizeMultiplier.data && guess.data && guess.data.randomNumber == guess.data.number && (
                  <div className={styles.status}>
                    <h2>Your prize is</h2>
                    <p>{shrinkUnits(formatEther(guess.data.bet.mul(prizeMultiplier.data).mul(97).div(100)), 5)} ETH</p>
                  </div>
                )
              }

              <div className={styles.btnWrapper}>
                {
                  recentWin.fetching
                    ? <Loader className={styles.loader}/>
                    : hasUnclaimedPrize && (
                    <Fragment>
                      <Button
                        disabled={timeLeft <= 0}
                        className={styles.btn}
                        onClick={handleOnClaimPrizeClick}
                      >
                        Claim
                      </Button>
                      {
                        currentBlockNumber.data && <p className={styles.timeLeft}>{timeLeftLabel}</p>
                      }
                    </Fragment>
                  )
                }
                <Button
                  className={styles.btn}
                  disabled={tryAgainBtnDisabled}
                  onClick={() => history.push('/casino/dashboard/guess')}
                >
                  Try again
                </Button>
              </div>
            </Fragment>
          )
      }
    </div>
  );
}