import {Fragment, h} from 'preact';
import styles from './index.scss';
import {Button} from '~/components/Button';
import ChevronBackIcon from '~/public/chevron-left-teal.svg';
import {Icon} from '~/components/Icon';
import {useHistory} from 'react-router';
import {SelectInput} from '~/components/SelectInput';
import {useState} from 'preact/hooks';
import {Input} from '~/components/Input';
import {isValidAddress} from '@walletconnect/utils';
import {cls, JoiUnit} from '~/utils/common';
import {TextArea} from '~/components/TextArea';
import {useDispatch} from 'react-redux';
import {votingActions} from '~/store/voting';
import {
  IStartCommonVotingReq,
  IStartUintChangeVotingReq,
  IStartUpgradeVotingReq,
  UintChangeVotingType,
  UpgradeVotingType,
  VotingType
} from '~/api/voting';
import {BigNumber} from 'ethers';
import {UintInput} from '~/components/UintInput';
import {useDefaultAsyncLazyLoadSelector, useSigner} from '~/store/utils';
import {joiTokenActions} from '~/store/joiToken';
import {formatEther} from 'ethers/lib/utils';
import {registryActions} from '~/store/registry';
import {AmountInput} from '~/components/AmountInput';
import {DaysInput} from '~/components/DaysInput';
import {toast} from 'react-toastify';


export function votingTypeToStr(type: VotingType): string {
  switch (type) {
    case VotingType.COMMON:
      return 'Common';
    case VotingType.UPGRADE:
      return 'Upgrade';
    case VotingType.UINT_CHANGE:
      return 'Change';
    default:
      return 'Invalid type';
  }
}

export function upgradeVotingTypeToStr(type: UpgradeVotingType): string {
  switch (type) {
    case UpgradeVotingType.UPGRADE_CASINO:
      return 'Casino contract';
    case UpgradeVotingType.UPGRADE_ACCOUNTANT:
      return 'Accountant contract';
    case UpgradeVotingType.UPGRADE_VOTING:
      return 'Voting contract';
    default:
      return 'Invalid type';
  }
}

export function changeVotingTypeToStr(type: UintChangeVotingType): string {
  switch (type) {
    case UintChangeVotingType.CHANGE_NINE_TOKEN_MAX_TOTAL_SUPPLY:
      return 'Increase Joi token maximum supply';
    case UintChangeVotingType.CHANGE_NINE_TOKEN_PER_ETH_MINT_PRICE_PERCENT:
      return 'Update Joi token minting price ETH';
    default:
      return 'Invalid type';
  }
}

function votingTypeToNote(type: VotingType): string {
  switch (type) {
    case VotingType.COMMON:
      return 'for any distributed decision making';
    case VotingType.UPGRADE:
      return 'when you have new features';
    case VotingType.UINT_CHANGE:
      return 'when you want to change the protocol';
    default:
      return 'error';
  }
}

function changeVotingTypeToNote(
  type: UintChangeVotingType,
  maxTotalSupply: BigNumber | null,
  joiPerEthMintPricePercent: BigNumber | null
): string {
  switch (type) {
    case UintChangeVotingType.CHANGE_NINE_TOKEN_MAX_TOTAL_SUPPLY:
      return `current value is ${formatEther(maxTotalSupply || BigNumber.from(0))} ${JoiUnit.Joi}`;

    case UintChangeVotingType.CHANGE_NINE_TOKEN_PER_ETH_MINT_PRICE_PERCENT:
      return `current value is ${joiPerEthMintPricePercent?.toString()}%`;

    default:
      return 'Invalid voting type';
  }
}

const votingTypes = [VotingType.COMMON, VotingType.UPGRADE, VotingType.UINT_CHANGE];
const upgradeVotingTypes = [UpgradeVotingType.UPGRADE_CASINO, UpgradeVotingType.UPGRADE_ACCOUNTANT, UpgradeVotingType.UPGRADE_VOTING];
const changeVotingTypes = [UintChangeVotingType.CHANGE_NINE_TOKEN_MAX_TOTAL_SUPPLY, UintChangeVotingType.CHANGE_NINE_TOKEN_PER_ETH_MINT_PRICE_PERCENT];


export function DaoVotingNewPage() {
  const maxTotalSupply = useDefaultAsyncLazyLoadSelector(
    state => state.joiToken.maxTotalSupply,
    joiTokenActions.getMaxTotalSupply.start()
  );

  const joiPerEthMintPricePercent = useDefaultAsyncLazyLoadSelector(
    state => state.joiToken.joiPerEthMintPricePercent,
    joiTokenActions.getJoiPerEthMintPricePercent.start()
  );

  const casinoAddress = useDefaultAsyncLazyLoadSelector(
    state => state.registry.casinoRO,
    registryActions.getCasino.start()
  ).data?.address;

  const accountantAddress = useDefaultAsyncLazyLoadSelector(
    state => state.registry.accountantRO,
    registryActions.getAccountant.start()
  ).data?.address;

  const votingAddress = useDefaultAsyncLazyLoadSelector(
    state => state.registry.votingRO,
    registryActions.getVoting.start()
  ).data?.address;

  const [votingType, setVotingType] = useState(VotingType.COMMON);
  const [upgradeVotingType, setUpgradeVotingType] = useState(UpgradeVotingType.UPGRADE_CASINO);
  const [changeVotingType, setChangeVotingType] = useState(UintChangeVotingType.CHANGE_NINE_TOKEN_MAX_TOTAL_SUPPLY);

  let defaultNextVersionAddress: string | undefined;
  switch (upgradeVotingType) {
    case UpgradeVotingType.UPGRADE_CASINO:
      defaultNextVersionAddress = casinoAddress;
      break;
    case UpgradeVotingType.UPGRADE_ACCOUNTANT:
      defaultNextVersionAddress = accountantAddress;
      break;
    case UpgradeVotingType.UPGRADE_VOTING:
      defaultNextVersionAddress = votingAddress;
      break;
    default:
      defaultNextVersionAddress = undefined;
  }
  const [nextVersionAddress, setNextVersionAddress] = useState(defaultNextVersionAddress);
  const [nextVersionAddressError, setNextVersionAddressError] = useState<string | null>(null);

  let defaultNewValue: BigNumber | undefined;
  switch (changeVotingType) {
    case UintChangeVotingType.CHANGE_NINE_TOKEN_MAX_TOTAL_SUPPLY:
      defaultNewValue = maxTotalSupply.data || undefined;
      break;
    case UintChangeVotingType.CHANGE_NINE_TOKEN_PER_ETH_MINT_PRICE_PERCENT:
      defaultNewValue = joiPerEthMintPricePercent.data || undefined;
      break;
    default:
      defaultNewValue = undefined;
  }
  const [newValue, setNewValue] = useState(defaultNewValue);
  const [newValueError, setNewValueError] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  const [duration, setDuration] = useState(0);
  const [durationError, setDurationError] = useState<string | null>(null);


  const handleOnNewContractAddressChange = (newValue: string) => {
    setNextVersionAddress(newValue.trim());

    if (votingType != VotingType.UPGRADE) {
      setNextVersionAddressError(null);
    }

    if (!isValidAddress(newValue)) {
      setNextVersionAddressError('Invalid address');
    } else {
      setNextVersionAddressError(null);
    }
  };

  const handleDescriptionChange = (newValue: string) => {
    setDescription(newValue.trim());

    if (newValue.trim().length == 0) {
      setDescriptionError('Type at least something useful');
    } else {
      setDescriptionError(null);
    }
  };

  const handleDurationChange = (newValue: number) => {
    setDuration(newValue);

    if (newValue <= 0) {
      setDurationError('Duration should be more than zero');
    } else if (newValue > 365) {
      setDurationError('Duration should be less than a year');
    } else if (votingType == VotingType.UPGRADE && newValue < 30) {
      setDurationError('Duration of "Upgrade" voting should be more than 30 days');
    } else if (votingType == VotingType.UINT_CHANGE && newValue < 14) {
      setDurationError('Duration of "Change" voting should be more than 14 days');
    } else {
      setDurationError(null);
    }
  };

  const handleNewValueChange = (newValue: BigNumber) => {
    setNewValue(newValue);

    if (votingType != VotingType.UINT_CHANGE) {
      setNewValueError(null);
      return;
    }

    if (newValue.isNegative()) {
      setNewValueError('The value should not be negative');

    } else if (changeVotingType == UintChangeVotingType.CHANGE_NINE_TOKEN_MAX_TOTAL_SUPPLY) {
      if (newValue.gt(BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffff'))) {
        setNewValueError('The value is too big (should fit in 192 bits)');
      } else if (newValue.lte(maxTotalSupply.data || BigNumber.from(0))) {
        setNewValueError('The value should be bigger than the previous one')
      } else {
        setNewValueError(null);
      }

    } else if (changeVotingType == UintChangeVotingType.CHANGE_NINE_TOKEN_PER_ETH_MINT_PRICE_PERCENT && newValue.gt(BigNumber.from('0xffffffffffffffff'))) {
      setNewValueError('The value is too big (should fit in 64 bits)');

    } else {
      setNewValueError(null);
    }
  };

  const history = useHistory();
  const dispatch = useDispatch();
  const signer = useSigner();

  const handleBackBtnClick = () => {
    history.goBack();
  };

  const handleBtnClick = () => {
    let req: IStartCommonVotingReq | IStartUpgradeVotingReq | IStartUintChangeVotingReq;
    const durationSec = 60 * 60 * 24 * duration;

    if ((votingType == VotingType.UPGRADE && !nextVersionAddress) || (votingType == VotingType.UINT_CHANGE && !newValue)) {
      console.error('Missing inputs');
      return;
    }
    if (!signer) {
      toast.error('Wallet not connected');
      history.push('/connect-wallet');

      return;
    }

    switch (votingType) {
      case VotingType.COMMON:
        req = {durationSec, description};
        break;

      case VotingType.UPGRADE:
        req = {durationSec, description, type: upgradeVotingType, nextVersionAddress: nextVersionAddress!};
        break;

      case VotingType.UINT_CHANGE:
        req = {durationSec, description, type: changeVotingType, newValue: newValue!};
        break;

      default:
        throw new Error('Invalid voting type');
    }

    dispatch(votingActions.startNew.start({type: votingType, req, signer}));
  };

  const showNextVersionAddressField = votingType == VotingType.UPGRADE;
  const showNewValueField = votingType == VotingType.UINT_CHANGE;
  const newValueTitle = changeVotingType == UintChangeVotingType.CHANGE_NINE_TOKEN_MAX_TOTAL_SUPPLY
    ? 'New maximum supply value'
    : 'New Joi per ETH minting price percent value';

  const btnDisabled = showNextVersionAddressField && !nextVersionAddress || !!nextVersionAddressError
    || !!newValueError
    || !description;

  return (
    <div className={styles.daoVotingsNewPage}>
      <Button
        onClick={handleBackBtnClick}
        className={styles.backBtn}
        icon={<Icon src={ChevronBackIcon}/>}
      >
        Back
      </Button>

      <h2>New voting</h2>

      <h3>Voting type</h3>
      <SelectInput
        defaultValue={votingType}
        onChange={setVotingType}
        className={styles.typeInput}
        options={votingTypes.map(it => ({value: it, label: votingTypeToStr(it)}))}
      />
      <p className={styles.note}>{votingTypeToNote(votingType)}</p>

      {
        (() => {
          switch (votingType) {
            case VotingType.UPGRADE:
              return (
                <Fragment>
                  <h3>'Upgrade' voting type</h3>
                  <SelectInput
                    defaultValue={upgradeVotingType}
                    onChange={setUpgradeVotingType}
                    className={styles.typeInput}
                    options={upgradeVotingTypes.map(it => ({value: it, label: upgradeVotingTypeToStr(it)}))}
                  />
                </Fragment>
              );
            case VotingType.UINT_CHANGE:
              return (
                <Fragment>
                  <h3>'Change' voting type</h3>
                  <SelectInput
                    defaultValue={changeVotingType}
                    onChange={setChangeVotingType}
                    className={styles.typeInput}
                    options={changeVotingTypes.map(it => ({value: it, label: changeVotingTypeToStr(it)}))}
                  />
                </Fragment>
              )
            default:
              return undefined;
          }
        })()
      }

      <h3>Voting duration</h3>
      <DaysInput
        defaultValue={duration}
        onChange={handleDurationChange}
        className={styles.typeInput}
      />
      {
        durationError
          ? <p className={cls(styles.note, styles.error)}>{durationError}</p>
          : <p className={styles.note}>make sure it suits others</p>
      }

      {
        showNextVersionAddressField && (
          <Fragment>
            <h3>New contract version address</h3>
            <Input
              placeholder='0x...'
              className={cls(styles.newContractInput, nextVersionAddressError && styles.error)}
              value={nextVersionAddress}
              onChange={handleOnNewContractAddressChange}
            />
            {
              nextVersionAddressError
                ? <p className={cls(styles.note, styles.error)}>{nextVersionAddressError}</p>
                : <p className={styles.note}>please double-check this address</p>
            }
          </Fragment>
        )
      }

      {
        showNewValueField && (
          <Fragment>
            <h3>{newValueTitle}</h3>
            {
              changeVotingType == UintChangeVotingType.CHANGE_NINE_TOKEN_PER_ETH_MINT_PRICE_PERCENT
                ? (
                  <UintInput
                    placeholder='1234'
                    className={cls(styles.newContractInput, newValueError && styles.error)}
                    defaultValue={newValue}
                    onChange={handleNewValueChange}
                    icon={<span>%</span>}
                  />
                )
                : (
                  <AmountInput
                    placeholder='10000'
                    className={cls(styles.newContractInput, newValueError && styles.error)}
                    defaultValue={newValue}
                    max={BigNumber.from('0xffffffffffffffffffffffffffffffffffffffffffffffff')}
                    onChange={handleNewValueChange}
                  />
                )
            }
            {
              newValueError
                ? <p className={cls(styles.note, styles.error)}>{newValueError}</p>
                : <p className={styles.note}>{changeVotingTypeToNote(changeVotingType, maxTotalSupply.data, joiPerEthMintPricePercent.data)}</p>
            }
          </Fragment>
        )
      }

      <h3>Description</h3>
      <TextArea
        className={styles.description}
        placeholder='A proposal spelled in a way that others could agree or disagree on it. Include as many useful links (code, contract on etherscan, discussions, etc.) as needed.'
        value={description}
        onChange={handleDescriptionChange}
      />
      {
        descriptionError
          ? <p className={cls(styles.note, styles.error)}>{descriptionError}</p>
          : <p className={styles.note}>keep it simple and polite - everybody will see that</p>
      }

      <div className={styles.btnWrapper}>
        <Button
          className={styles.btn}
          onClick={handleBtnClick}
          disabled={btnDisabled}
        >
          Start
        </Button>
      </div>
    </div>
  );
}