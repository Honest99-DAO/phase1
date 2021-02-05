import {BigNumber} from 'ethers';
import {h} from 'preact';
import styles from './index.scss';
import {formatEther} from 'ethers/lib/utils';
import {cls, EtherUnit, shrinkUnits} from '~/utils/common';


interface IPropsCasino {
  prizeFund: BigNumber;
  guessesToday: number;
}

export function CasinoHeader(props: IPropsCasino) {
  const prizeFund = shrinkUnits(formatEther(props.prizeFund), 3);


  return (
    <div className={cls(styles.casinoHeader, styles.casino)}>
      <div className={styles.line}>
        <p>Prize fund <b><i>{prizeFund} {EtherUnit.ETHER}</i></b></p>
        <p><b>{props.guessesToday}</b> guesses today</p>
      </div>
    </div>
  );
}