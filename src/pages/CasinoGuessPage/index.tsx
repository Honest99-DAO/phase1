import {useDispatch} from 'react-redux';
import styles from './index.scss';
import {Fragment, h} from 'preact';
import {BigNumber} from 'ethers';
import {WinnersList} from '~/components/WinnersList';
import {Input} from '~/components/Input';
import {AmountInput} from '~/components/AmountInput';
import {useState} from 'preact/hooks';
import {Button} from '~/components/Button';
import {formatUnits, parseEther} from 'ethers/lib/utils';
import {EtherUnit, randomInt, shrinkUnits} from '~/utils/common';
import RandomIcon from '~/public/random.svg';
import {Icon} from '~/components/Icon';
import {Spoiler} from '~/components/Spoiler';
import {casinoActions, ICasinoWinEvent} from '~/store/casino';
import {useDefaultAsyncLazyLoadSelector, useSigner} from '~/store/utils';
import {toast} from 'react-toastify';
import {Utils} from '../../../types/ethers-contracts';
import {useHistory} from 'react-router';


export function CasinoGuessPage() {
  const casinoRecentWinners = useDefaultAsyncLazyLoadSelector(
    state => state.casino.recentWinners,
    casinoActions.getRecentWinners.start()
  );

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

  const btnDisabled = !number || !amount || (amount && amount.lt(1));

  const history = useHistory();

  const handleButtonClick = () => {
    if (!signer) {
      toast.error('Wallet not connected');
      history.push('/connect-wallet');

      return;
    }

    dispatch(casinoActions.makeAGuess.start({req: {number: number!, bet: amountWithFee!}, signer}));
  };

  const mockWinEvents: ICasinoWinEvent[] = [
    {
      player: '0x0000000000000000000000000000000000000000',
      prize: parseEther('123.4123'),
      number: 99,
      blockHash: ''
    },
    {
      player: '0x0000000000000000000000000000000000000000',
      prize: parseEther('0.21'),
      number: 5,
      blockHash: ''
    },
    {
      player: '0x0000000000000000000000000000000000000000',
      prize: parseEther('1.4123'),
      number: 14,
      blockHash: ''
    },
  ];

  return (
    <div className={styles.guessPage}>
      <div className={styles.headerWrapper}>
        {
          mockWinEvents && mockWinEvents.length > 0 && (
            <div className={styles.winners}>
              <h2>Recent winners</h2>
              <WinnersList data={mockWinEvents || []}/>
            </div>
          )
        }
      </div>

      <div className={styles.inputWrapper}>
        <h2>Guess the number</h2>
        <p>If you win you will have 255 blocks left to claim a reward</p>

        <AmountInput
          className={styles.amountInput}
          placeholder='I bet'
          onChange={handleAmountChange}
          onUnitChange={u => setUnit(u as EtherUnit)}
        />
        <Input
          value={number as unknown as string}
          pattern='\d{1,2}'
          onChange={handleNumberChange}
          className={styles.betInput}
          placeholder='I guess the number is'
          icon={<Icon onClick={handleRandomClick} src={RandomIcon}/>}
        />
      </div>

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