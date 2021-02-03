import {cls, IChildren, IClassName} from '~/utils/common';
import styles from './index.scss';
import {h} from 'preact';
import {Icon} from '~/components/Icon';
import ChevronUpIcon from '~/public/chevron-up.svg';
import ChevronDownIcon from '~/public/chevron-down.svg';
import {useState} from 'preact/hooks';


interface IProps extends Partial<IClassName>, IChildren {
  title: string;
  defaultOpen?: boolean;
}

export function Spoiler(props: IProps) {
  const [open, setOpen] = useState(props.defaultOpen == undefined ? true : props.defaultOpen);

  const handleHeaderClick = () => {
    setOpen(!open);
  }

  return (
    <div className={cls(styles.spoiler, props.className)}>
      <div onClick={handleHeaderClick} className={styles.header}>
        <p>{props.title}</p>
        <Icon src={open ? ChevronDownIcon : ChevronUpIcon}/>
      </div>
      <div className={cls(styles.content, !open && styles.hidden)}>
        {props.children}
      </div>
    </div>
  )
}