import styles from './index.scss';
import {h} from 'preact';
import {Spoiler} from '~/components/Spoiler';
import {VotingList} from '~/components/VotingList';
import {Button} from '~/components/Button';
import {useHistory} from 'react-router';
import {BigNumber} from 'ethers';
import {useDefaultAsyncLazyLoadSelector} from '~/store/utils';
import {votingActions} from '~/store/voting';
import {ISomeVoting, VotingType, votingTypeToString} from '~/api/voting';
import {registryActions} from '~/store/registry';


export function DaoVotingsPage() {
  const votings = useDefaultAsyncLazyLoadSelector(
    state => state.voting.votings,
    votingActions.getVotings.start()
  );
  const currentBlock = useDefaultAsyncLazyLoadSelector(
    state => state.registry.currentBlock,
    registryActions.getCurrentBlock.start()
  );

  const ongoingVotings: ISomeVoting[] = [];
  const executedVotings: ISomeVoting[] = [];

  votings.data?.forEach(it => {
    if (!it.executed) {
      ongoingVotings.push(it);
    } else {
      executedVotings.push(it);
    }
  });

  const history = useHistory();
  const handleButtonClick = () => {
    history.push('/dao/dashboard/votings/new');
  };

  const handleVotingClick = (id: BigNumber, type: VotingType) => {
    history.push(`/dao/dashboard/votings/view/${votingTypeToString(type)}/${id.toString()}`);
  };

  return (
    <div className={styles.daoVotingsPage}>
      <div className={styles.btnWrapper}>
        <Button onClick={handleButtonClick} className={styles.btn}>
          Start new
        </Button>
      </div>

      <Spoiler className={styles.spoiler1} title='Ongoing'>
        {
          ongoingVotings.length > 0 && currentBlock.data
            ? (
              <VotingList
                currentBlockTimestamp={currentBlock.data.timestamp}
                onVotingClick={handleVotingClick}
                votings={ongoingVotings}
              />
            )
            : <p>There are no ongoing votings right now</p>
        }

      </Spoiler>

      <Spoiler className={styles.spoiler2} title='Executed'>
        {
          executedVotings.length > 0 && currentBlock.data
            ? (
              <VotingList
                currentBlockTimestamp={currentBlock.data.timestamp}
                onVotingClick={handleVotingClick}
                votings={executedVotings}
              />
            )
            : <p>There are no executed votings yet</p>
        }
      </Spoiler>
    </div>
  );
}