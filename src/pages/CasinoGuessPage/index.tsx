import {useDispatch} from 'react-redux';
import styles from './index.scss';
import {h} from 'preact';
import {BigNumber} from 'ethers';
import {WinnersList} from '~/components/WinnersList';
import {Input} from '~/components/Input';
import {AmountInput} from '~/components/AmountInput';
import {useState} from 'preact/hooks';
import {Button} from '~/components/Button';
import {formatEther, parseEther} from 'ethers/lib/utils';
import {randomInt, shrinkUnits, useChainId} from '~/utils/common';
import RandomIcon from '~/public/random.svg';
import {Icon} from '~/components/Icon';
import {casinoActions} from '~/store/casino';
import {useDefaultAsyncLazyLoadSelector, useSigner} from '~/store/utils';
import {toast} from 'react-toastify';
import {useHistory} from 'react-router';
import {Loader} from '~/components/Loader';


export function CasinoGuessPage() {
  const chainId = useChainId();

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

    dispatch(casinoActions.makeAGuess.start({req: {number: number!, bet: amount!}, signer}));
  };

  return (
    <div className={styles.guessPage}>
      <div className={styles.headerWrapper}>
        {
          !casinoRecentWinners.fetching
            ? casinoRecentWinners.data && casinoRecentWinners.data.length > 0 && (
            <div className={styles.winners}>
              <h2>Recent winners</h2>
              <WinnersList chainId={chainId} data={casinoRecentWinners.data || []}/>
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
        <p className={styles.blocksNote}>You'll have ~1 hour (255 blocks) to claim your prize</p>

        <AmountInput
          value={amount ? formatEther(amount) : ''}
          label='ETH'
          className={styles.amountInput}
          placeholder='I bet'
          min={BigNumber.from(0)}
          max={maxBetSize}
          onChange={handleAmountChange}
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
      </div>
    </div>
  );
}