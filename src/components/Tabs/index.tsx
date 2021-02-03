import {cls, IClassName} from '~/utils/common';
import {h} from 'preact';
import styles from './index.scss';
import {useHistory} from 'react-router';


export interface ITab {
  title: string;
  onClickNavTo: string;
}

interface IProps extends Partial<IClassName> {
  tabs: ITab[];
}

export function Tabs(props: IProps) {
  const history = useHistory();

  const renderTabs = () => props.tabs.map((it, idx) =>
    <span
      onClick={() => history.push(it.onClickNavTo)}
      key={idx}
      className={cls(styles.tab, history.location.pathname.startsWith(it.onClickNavTo) && styles.active)}
    >
      {it.title}
    </span>
  );

  return (
    <div className={cls(styles.tabs, props.className)}>
      {renderTabs()}
    </div>
  )
}