import {BigNumber} from 'ethers';
import {h} from 'preact';
import styles from './index.scss';
import {formatEther} from 'ethers/lib/utils';
import {calcEtherShare, cls, EtherUnit, JoiUnit, shrinkUnits} from '~/utils/common';
import {DateTime} from 'luxon';
import {Button} from '~/components/Button';
import {THIRTY_DAYS} from '~/utils/common';


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


interface IPropsDao {
  userBalance: BigNumber;
  payoutPeriodStaredAt: number;
  myCurrentProfit: BigNumber;
  totalSupply: BigNumber;
  currentBlockTimestamp: number;
  onButtonClick: () => void;
  buttonText: string;
}

export function DaoHeader(props: IPropsDao) {
  const userBalance = shrinkUnits(formatEther(props.userBalance), 3);
  const userSharePercent = calcEtherShare(props.userBalance, props.totalSupply).toPrecision(5);
  const payoutPeriodStartedAtFormatted = DateTime.fromSeconds(props.payoutPeriodStaredAt).toFormat('LLL y');
  const myCurrentProfit = shrinkUnits(formatEther(props.myCurrentProfit), 3);

  const buttonDisabled = props.myCurrentProfit.eq(BigNumber.from(0))
    && props.payoutPeriodStaredAt + THIRTY_DAYS > props.currentBlockTimestamp;

  return (
    <div className={cls(styles.casinoHeader, styles.dao)}>
      <div className={styles.line}>
        <p>{payoutPeriodStartedAtFormatted} balance: <b><i>{userBalance} {JoiUnit.Joi}</i></b></p>
        <p>(<b>{userSharePercent}%</b> of distributed)</p>
      </div>

      <div className={styles.line}>
        <p>{payoutPeriodStartedAtFormatted} profit: <b><i>{myCurrentProfit} {EtherUnit.ETHER}</i></b></p>

        <Button
          onClick={props.onButtonClick}
          disabled={buttonDisabled}
          className={styles.btn}
        >
          {props.buttonText}
        </Button>
      </div>
    </div>
  );
}