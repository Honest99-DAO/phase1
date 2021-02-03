import {h} from 'preact';
import styles from './index.scss';
import {cls, IClassName, plural} from '~/utils/common';
import {BigNumber} from 'ethers';
import {Distribution, IDistributionEntry} from '~/components/Distribution';
import {DateTime} from 'luxon';
import {Icon} from '~/components/Icon';
import ChevronRightIcon from '~/public/chevron-right-teal.svg';
import {ISomeVoting, VotingType, votingTypeToString} from '~/api/voting';



interface IProps extends Partial<IClassName> {
  votings: ISomeVoting[];
  currentBlockTimestamp: number;
  onVotingClick?: (id: BigNumber, type: VotingType) => void;
}

export function votingDateStr(_createdAt: number, _finishedAt: number, _now: number): string {
  const createdAt = DateTime.fromSeconds(_createdAt);
  const finishedAt = DateTime.fromSeconds(_finishedAt);
  const now = DateTime.fromSeconds(_now);

  const diff = Math.floor(finishedAt.diff(now, 'days').days);

  return createdAt < now && finishedAt > now
    ? diff > 0 ? `${diff} ${plural(diff, 'day', 'days', 'days')} left` : 'ends today'
    : finishedAt.toFormat('dd.LL.y');
}

export function VotingList(props: IProps) {
  const renderVotings = () => props.votings.map((it, idx) => {
    const entries: IDistributionEntry[] = [
      {value: it.totalRejected, color: '#FF4646', legend: 'Rejected'},
      {value: it.totalAccepted, color: '#03AB00', legend: 'Accepted'}
    ];
    const finishedAt = DateTime.fromSeconds(it.createdAt + it.duration);
    const now = DateTime.fromSeconds(props.currentBlockTimestamp);
    const dateStr = votingDateStr(it.createdAt, finishedAt.toSeconds(), props.currentBlockTimestamp);

    const requiresExecution = now > finishedAt && !it.executed;
    let typeCls: string;
    switch (it.votingSuperType) {
      case VotingType.COMMON:
        typeCls = styles.common;
        break;
      case VotingType.UPGRADE:
        typeCls = styles.upgrade;
        break;
      case VotingType.UINT_CHANGE:
        typeCls = styles.change;
        break;
    }

    return (
      <div
        onClick={() => props.onVotingClick && props.onVotingClick(it.id, it.votingSuperType)}
        key={idx}
        className={cls(styles.voting, requiresExecution && styles.requiresExecution)}
      >
        <p className={styles.id}>{it.id.toString()}</p>
        <p className={cls(styles.type, typeCls!)}>{votingTypeToString(it.votingSuperType)}</p>
        <Distribution
          forceTextColor='black'
          postfixLength={-1}
          className={styles.distribution}
          simple
          entries={entries}
        />
        <p className={styles.date}>{dateStr}</p>
        <Icon src={ChevronRightIcon}/>
      </div>
    );
  });

  return (
    <div className={cls(styles.votingList, props.className)}>
      {renderVotings()}
    </div>
  );
}