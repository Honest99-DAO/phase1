import {h} from 'preact';
import styles from './index.scss';
import {CasinoHeader} from '~/components/Header';
import {Button} from '~/components/Button';
import {NumberBar} from '~/components/NumberBar';
import {useHistory, useParams} from 'react-router';
import {useDefaultAsyncLazyLoadSelector} from '~/store/utils';
import {casinoActions} from '~/store/casino';
import {useSelector} from 'react-redux';
import {IAppState} from '~/store';
import {restoreGuessNumber, shrinkUnits} from '~/utils/common';
import {Loader} from '~/components/Loader';
import {formatEther} from 'ethers/lib/utils';


export function CasinoResultPage() {
  const {mode} = useParams<{ mode: string }>();
  const history = useHistory();

  const guess = useSelector((state: IAppState) => state.casino.guess);
  const savedNumber = restoreGuessNumber();

  const prizeMultiplier = useDefaultAsyncLazyLoadSelector(
    state => state.casino.prizeMultiplier,
    casinoActions.getPrizeMultiplier.start()
  );

  return (
    <div className={styles.guessResultPage}>
      <div className={styles.guess}>
        <h2>Your guess</h2>
        <p>{savedNumber}</p>
      </div>

      <div className={styles.result}>
        <h2>The number is</h2>
        <NumberBar number={guess.fetching ? undefined : guess.data!.randomNumber} min={0} max={100}/>
      </div>

      {
        prizeMultiplier.data && guess.data && guess.data.randomNumber == guess.data.number && (
          <div className={styles.status}>
            <h2>Your prize is</h2>
            <p>{shrinkUnits(formatEther(guess.data.bet.mul(prizeMultiplier.data)), 5)} ETH</p>
          </div>
        )
      }

      <div className={styles.btnWrapper}>
      {
        guess.fetching
          ? <Loader className={styles.loader}/>
          : (
            <Button
              className={styles.btn}
              onClick={() => history.push('/casino/dashboard/guess')}
            >
              Try again
            </Button>
          )
      }
      </div>
    </div>
  );
}