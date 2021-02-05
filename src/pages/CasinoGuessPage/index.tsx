import {useDispatch} from 'react-redux';
import styles from './index.scss';
import {h} from 'preact';
import {BigNumber} from 'ethers';
import {WinnersList} from '~/components/WinnersList';
import {Input} from '~/components/Input';
import {AmountInput} from '~/components/AmountInput';
import {useState} from 'preact/hooks';
import {Button} from '~/components/Button';
import {formatEther, formatUnits, parseEther} from 'ethers/lib/utils';
import {EtherUnit, randomInt, shrinkUnits} from '~/utils/common';
import RandomIcon from '~/public/random.svg';
import {Icon} from '~/components/Icon';
import {casinoActions} from '~/store/casino';
import {useDefaultAsyncLazyLoadSelector, useSigner} from '~/store/utils';
import {toast} from 'react-toastify';
import {useHistory} from 'react-router';
import {Loader} from '~/components/Loader';


export function CasinoGuessPage() {
  const casinoRecentWinners = useDefaultAsyncLazyLoadSelector(
    state => state.casino.recentWinners,
    casinoActions.getRecentWinners.start()
  );

  const prizeFund = useDefaultAsyncLazyLoadSelector(
    state => state.casino.prizeFund,
    casinoActions.getPrizeFund.start()
  );

  const prizeMultiplier = useDefaultAsyncLazyLoadSelector(
    state => state.casino.prizeMultiplier,
    casinoActions.getPrizeMultiplier.start()
  );

  const betHardCap = parseEther('200');

  let maxBetSize = betHardCap.div(95);
  if (prizeFund.data && prizeMultiplier.data) {
    if (betHardCap.lt(prizeFund.data.div(2))) {
      maxBetSize = betHardCap.div(prizeMultiplier.data);
    } else {
      maxBetSize = prizeFund.data.div(2).div(prizeMultiplier.data);
    }
  }

  const dispatch = useDispatch();
  const signer = useSigner();

  const [amount, setAmount] = useState<BigNumber | undefined>(undefined);
  const handleAmountChange = (newAmount: BigNumber) => {
    setAmount(newAmount);
  };

  const [unit, setUnit] = useState(EtherUnit.ETHER);
  const amountWithFee = amount && amount.gt(0)
    ? amount.mul(101).div(100)
    : undefined;

  const amountWithFeeStr = amountWithFee && shrinkUnits(formatUnits(amountWithFee, unit));

  const [number, setNumber] = useState<number | undefined>(undefined);
  const handleNumberChange = (newBet: string) => {
    if (newBet.trim()) {
      setNumber(parseInt(newBet));
    } else {
      setNumber(undefined);
    }
  };

  const handleRandomClick = () => {
    setNumber(randomInt(0, 100));
  };

  const btnDisabled = !number || !amount || (amount && amount.lt(1)) || casinoRecentWinners.fetching;

  const history = useHistory();

  const handleButtonClick = () => {
    if (!signer) {
      toast.error('Wallet not connected');
      history.push('/connect-wallet');

      return;
    }

    dispatch(casinoActions.makeAGuess.start({req: {number: number!, bet: amountWithFee!}, signer}));
  };

  return (
    <div className={styles.guessPage}>
      <div className={styles.headerWrapper}>
        {
          !casinoRecentWinners.fetching
            ? casinoRecentWinners.data && casinoRecentWinners.data.length > 0 && (
            <div className={styles.winners}>
              <h2>Recent winners</h2>
              <WinnersList data={casinoRecentWinners.data || []}/>
            </div>
          )
            : (
              <div className={styles.winners}>
                <Loader className={styles.loader}/>
              </div>
            )
        }
      </div>

      <div className={styles.inputWrapper}>
        <h2>Guess the number</h2>

        <AmountInput
          className={styles.amountInput}
          placeholder='I bet'
          min={BigNumber.from(0)}
          max={maxBetSize}
          onChange={handleAmountChange}
          onUnitChange={u => setUnit(u as EtherUnit)}
        />
        <p className={styles.note}>Max bet value is {shrinkUnits(formatEther(maxBetSize), 5)} ETH</p>

        <Input
          value={number as unknown as string}
          pattern='\d{1,2}'
          onChange={handleNumberChange}
          className={styles.betInput}
          placeholder='I guess the number is'
          icon={<Icon onClick={handleRandomClick} src={RandomIcon}/>}
        />
      </div>

      {
        prizeMultiplier.data && amount && amount.gt(0) && (
          <p>Estimated prize is <b>{shrinkUnits(formatEther(amount.mul(prizeMultiplier.data)), 3)} ETH</b></p>
        )
      }

      <div className={styles.buttonWrapper}>
        <Button
          disabled={btnDisabled}
          className={styles.btn}
          onClick={handleButtonClick}
        >
          Make a guess
        </Button>
        {
          amountWithFee && <i><b>{amountWithFeeStr} {unit}</b> including fee</i>
        }
      </div>
    </div>
  );
}