import {Distribution, IDistributionEntry} from '~/components/Distribution';
import {Fragment, h} from 'preact';
import {formatUnits} from 'ethers/lib/utils';
import styles from './index.scss';
import {CONFIG} from '~/config';
import {
  EtherUnit,
  etherUnitToJoiUnit,
  FOUNDER_REWARD,
  JoiUnit,
  linkToContract,
  MAX_MINTED,
  shrinkAddress
} from '~/utils/common';
import {AmountInput} from '~/components/AmountInput';
import {useState} from 'preact/hooks';
import {BigNumber} from 'ethers';
import {Button} from '~/components/Button';
import {useDispatch} from 'react-redux';
import {joiTokenActions} from '~/store/joiToken';
import {registryActions} from '~/store/registry';
import {useDefaultAsyncLazyLoadSelector, useSigner} from '~/store/utils';
import {toast} from 'react-toastify';
import {useHistory} from 'react-router';


export function DaoTokenPage() {
  const dispatch = useDispatch();
  const registryJoiTokenContract = useDefaultAsyncLazyLoadSelector(
    state => state.registry.joiTokenRO,
    registryActions.getJoiToken.start()
  );
  const joiTokenTotalSupply = useDefaultAsyncLazyLoadSelector(
    state => state.joiToken.totalSupply,
    joiTokenActions.getTotalSupply.start()
  );

  const entries: IDistributionEntry[] = [
    {
      value: MAX_MINTED.sub(joiTokenTotalSupply.data || BigNumber.from(0)),
      color: 'white',
      legend: 'Available'
    },
    {
      value: joiTokenTotalSupply.data?.sub(FOUNDER_REWARD) || BigNumber.from(0),
      color: '#0CB7A2',
      legend: 'Distributed'
    },
    {
      value: FOUNDER_REWARD,
      color: '#c4c4c4',
      legend: 'Founder'
    }
  ];

  const [amount, setAmount] = useState<BigNumber | null>(null);
  const [unit, setUnit] = useState(EtherUnit.ETHER);

  const btnDisabled = !amount || amount.eq(0);
  const soldOut = joiTokenTotalSupply.data && joiTokenTotalSupply.data!.eq(MAX_MINTED)

  const signer = useSigner();

  const history = useHistory();
  const handleBuyJois = () => {
    if (!signer) {
      toast.error('Wallet not connected');
      history.push('/connect-wallet');

      return;
    }
    if (!amount) return;

    dispatch(joiTokenActions.mint.start({amount, signer}));
  };

  return (
    <div className={styles.daoTokenPage}>
      <h2>Token distribution</h2>

      <Distribution
        className={styles.distribution}
        legend
        entries={entries}
      />

      <h2>Links</h2>
      <div className={styles.links}>
        {
          registryJoiTokenContract.data && (
            <p>Deployed at <a target='_blank' href={linkToContract(registryJoiTokenContract.data!.address)}>
              {shrinkAddress(registryJoiTokenContract.data!.address)}
            </a>
            </p>
          )
        }
        <p>Opensourced at <a target='_blank' href={CONFIG.mainGithubUrl}>github.com/honest-casino</a></p>
        <p>Discussion goes at <a target='_blank' href={CONFIG.discussionUrl}>t.me/honestcasinochat</a></p>
      </div>

      {
        !soldOut && (
          <Fragment>
            <h2>Buy {JoiUnit.Joi} with {EtherUnit.ETHER}</h2>
            <div className={styles.form}>
              <AmountInput
                onUnitChange={setUnit as (unit: EtherUnit | JoiUnit) => void}
                onChange={setAmount}
                placeholder='1.023'
              />
              {
                !btnDisabled && amount &&
                <p>You will receive <b>{formatUnits(amount, unit)} {etherUnitToJoiUnit(unit)}</b></p>
              }
            </div>
          </Fragment>
        )
      }

      <div className={styles.btnWrapper}>
        {
          soldOut
            ? <p>All Joi tokens were distributed!</p>
            : (
              <Fragment>
                <Button onClick={handleBuyJois} className={styles.btn} disabled={btnDisabled}>Buy Jois</Button>
                <p>All {EtherUnit.ETHER} goes to the prize pool of the casino</p>
              </Fragment>
            )
        }
      </div>
    </div>
  );
}