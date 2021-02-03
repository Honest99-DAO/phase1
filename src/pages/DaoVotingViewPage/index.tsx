import {Fragment, h} from 'preact';
import styles from './index.scss';
import {useHistory, useParams} from 'react-router';
import {Button} from '~/components/Button';
import {Icon} from '~/components/Icon';
import ChevronBackIcon from '~/public/chevron-left-teal.svg';
import {votingTypeToStr} from '~/pages/DaoVotingNewPage';
import {votingDateStr} from '~/components/VotingList';
import {cls, linkToContract, shrinkAddress, shrinkUnits} from '~/utils/common';
import {Distribution, IDistributionEntry} from '~/components/Distribution';
import {formatEther} from 'ethers/lib/utils';
import {BigNumber} from 'ethers';
import {useDefaultAsyncLazyLoadSelector, useSigner} from '~/store/utils';
import {useDispatch, useSelector} from 'react-redux';
import {IAppState} from '~/store';
import {useEffect} from 'preact/hooks';
import {votingActions} from '~/store/voting';
import {joiTokenActions} from '~/store/joiToken';
import {VoteStatus, VotingType, votingTypeFromString} from '~/api/voting';
import {push} from 'connected-react-router';
import {registryActions} from '~/store/registry';
import {toast} from 'react-toastify';


export function DaoVotingViewPage() {
  const dispatch = useDispatch();
  const history = useHistory();
  const params = useParams<{ id: string, type: string }>();

  const id = BigNumber.from(params.id);
  const type = votingTypeFromString(params.type);
  const voting = useSelector((state: IAppState) => state.voting.currentVoting);
  const signer = useSigner();

  useEffect(() => {
    dispatch(votingActions.getCurrentVoting.start({id, type}));
  }, []);

  if (voting.data && voting.data.createdAt == 0) {
    dispatch(push('/404'));
  }

  const currentVotingMyVote = useSelector((state: IAppState) => state.voting.currentVotingMyVote);

  useEffect(() => {
    if (!signer) {
      return;
    }

    dispatch(votingActions.getCurrentVotingMyVote.start({votingId: id, signer}));
  }, []);

  const userBalance = useDefaultAsyncLazyLoadSelector(
    state => state.joiToken.myBalanceAt,
    signer && voting.data ? joiTokenActions.getMyBalanceAt.start({signer, timestamp: voting.data.createdAt}) : null,
    [JSON.stringify(signer)]
  );

  const currentBlock = useDefaultAsyncLazyLoadSelector(
    state => state.registry.currentBlock,
    registryActions.getCurrentBlock.start()
  );

  const handleBackBtnClick = () => {
    history.goBack();
  };

  const handleAcceptClick = () => {
    if (!signer) {
      toast.error('Wallet not connected!');
      history.push('/connect-wallet');

      return;
    }

    dispatch(votingActions.vote.start({req: {votingId: id, status: VoteStatus.ACCEPT}, signer}));
  };

  const handleRejectClick = () => {
    if (!signer) {
      toast.error('Wallet not connected!');
      history.push('/connect-wallet');

      return;
    }

    dispatch(votingActions.vote.start({req: {votingId: id, status: VoteStatus.REJECT}, signer}));
  };

  const handleExecuteClick = () => {
    if (!signer) {
      toast.error('Wallet not connected!');
      history.push('/connect-wallet');

      return;
    }

    dispatch(votingActions.execute.start({votingId: id, signer}));
  };

  const finished = voting.data && currentBlock.data
    && (voting.data.createdAt + voting.data.duration < currentBlock.data.timestamp);

  const showUpgradeAlert = voting.data && voting.data.votingSuperType == VotingType.UPGRADE;

  const entries: IDistributionEntry[] = [
    {value: voting.data?.totalRejected || BigNumber.from(0), color: '#FF4646', legend: 'Rejected'},
    {value: voting.data?.totalAccepted || BigNumber.from(0), color: '#03AB00', legend: 'Accepted'}
  ];

  return (
    <div className={styles.daoVotingViewPage}>
      <Button
        onClick={handleBackBtnClick}
        className={styles.backBtn}
        icon={<Icon src={ChevronBackIcon}/>}
      >
        Back
      </Button>

      <h2>Voting #{voting.data?.id?.toString()}</h2>

      {
        voting.data && currentBlock.data && (
          <Fragment>
            <div className={styles.voting}>
              <div className={styles.header}>
                <p className={styles.type}>{votingTypeToStr(type)}</p>
                <p className={styles.dueDate}>
                  {
                    votingDateStr(
                      voting.data.createdAt,
                      voting.data.createdAt + voting.data.duration,
                      currentBlock.data.timestamp
                    )
                  }
                </p>
              </div>
              <p className={styles.description}>
                {voting.data.description}
              </p>
              {
                false && showUpgradeAlert && (
                  voting.data.executed
                    ? (
                      <p className={styles.alert}>
                        The address
                        of <b>{voting.data.votingType == VotingType.UPGRADE_VOTING ? 'voting' : 'casino'} contract</b> was
                        automatically changed to <a target='_blank' href={linkToContract(voting.data.nextVersionAddress)}>
                        {shrinkAddress(voting.data.nextVersionAddress)}</a>
                      </p>
                    )
                    : (
                      <p className={styles.alert}>
                        Accepting this voting you agree that the address
                        of <b>{voting.data.votingType == VotingType.UPGRADE_VOTING ? 'voting' : 'casino'} contract</b> will
                        automatically change to <a target='_blank'
                                                   href={linkToContract(voting.data.nextVersionAddress)}>{shrinkAddress(voting.data.nextVersionAddress)}</a>
                      </p>
                    )
                )
              }
            </div>

            <h3>Votes distribution</h3>
            <Distribution
              className={styles.distribution}
              forceTextColor='white'
              entries={entries}
              legend
            />

            <div className={styles.btnWrapper}>
              {
                voting.data.executed
                  ? (
                    <h3>The voting was executed!</h3>
                  )
                  : (
                    finished
                      ? (
                        <div className={cls(styles.btns, styles.finished)}>
                          <Button
                            className={styles.btn}
                            onClick={handleExecuteClick}
                          >
                            Execute
                          </Button>
                        </div>
                      )
                      : (
                        <Fragment>
                          <div className={styles.notes}>
                            <p>You have <b>{shrinkUnits(formatEther(userBalance?.data || BigNumber.from(0)))}</b> votes</p>
                            {
                              currentVotingMyVote.data
                                ? <p>You voted <b>{currentVotingMyVote.data == VoteStatus.ACCEPT ? 'ACCEPT' : 'REJECT'}</b> last time</p>
                                : ''
                            }
                          </div>
                          <div className={styles.btns}>
                            <Button
                              className={styles.btn}
                              onClick={handleRejectClick}
                            >
                              Reject
                            </Button>
                            <Button
                              className={styles.btn}
                              onClick={handleAcceptClick}
                            >
                              Accept
                            </Button>
                          </div>
                        </Fragment>
                      )
                  )
              }
            </div>
          </Fragment>
        )
      }

    </div>
  );
}