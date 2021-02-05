import {cls, IClassName} from '~/utils/common';
import {h} from 'preact';
import styles from './index.scss';
import {useHistory} from 'react-router';


export interface ITab {
  title: string;
  onClickNavTo: string;
  param?: string;
}

interface IProps extends Partial<IClassName> {
  tabs: ITab[];
}

export function Tabs(props: IProps) {
  const history = useHistory();

  const renderTabs = () => props.tabs.map((it, idx) => {
    const link = it.param ? it.onClickNavTo + '/' + it.param : it.onClickNavTo;

    return <span
      onClick={() => history.push(link)}
      key={idx}
      className={cls(styles.tab, history.location.pathname.startsWith(it.onClickNavTo) && styles.active)}
    >
      {it.title}
    </span>
  });

  return (
    <div className={cls(styles.tabs, props.className)}>
      {renderTabs()}
    </div>
  )
}