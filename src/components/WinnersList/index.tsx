import {cls, EtherUnit, IClassName, shrinkAddress, shrinkUnits} from '~/utils/common';
import {h} from 'preact';
import {formatEther} from 'ethers/lib/utils';
import styles from './index.scss';
import {ICasinoWinEvent} from '~/store/casino';


interface IProps extends Partial<IClassName> {
  data: ICasinoWinEvent[];
  lineClassName?: string;
}

export function WinnersList(props: IProps) {
  const renderLine = (line: ICasinoWinEvent) => (
    <div className={cls(styles.line, props.lineClassName)}>
      <span className={styles.address}>{shrinkAddress(line.player)}</span>
      <span className={styles.number}>{line.number}</span>
      <span className={styles.prize}>{shrinkUnits(formatEther(line.prize), 2)} ETH</span>
    </div>
  );

  return (
    <div className={cls(styles.winnersList, props.className)}>
      {
        props.data.map(renderLine)
      }
    </div>
  );
}