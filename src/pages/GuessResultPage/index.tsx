import {h} from 'preact';
import styles from './index.scss';
import {etherToWei} from '../../../test/utils';
import {CasinoHeader} from '~/components/Header';
import {Button} from '~/components/Button';
import {NumberBar} from '~/components/NumberBar';


export function GuessResultPage() {
  return (
    <div className={styles.guessResultPage}>
      <div className={styles.headerWrapper}>
        <CasinoHeader
          guessesToday={40}
          prizeFund={etherToWei(1234)}
        />
        <div className={styles.guess}>
          <h2>Your guess</h2>
          <p>99</p>
        </div>
      </div>

      <div className={styles.section}>
          <div className={styles.result}>
            <h2>The number is</h2>
            <NumberBar number={10} min={0} max={100}/>
          </div>
          <div className={styles.status}>
            <h2>Your prize</h2>
            <p>10.023 ether</p>
          </div>
      </div>

      <Button className={styles.btn}>Try again</Button>
    </div>
  );
}