import {cloneElement, h, VNode} from 'preact';
import {cls, IChildren, IClassName} from '~/utils/common';
import styles from './index.scss';
import {JSXInternal} from 'preact/src/jsx';
import TargetedEvent = JSXInternal.TargetedEvent;


interface IProps extends Partial<IClassName>, IChildren {
  onClick?: (e: TargetedEvent) => void;
  icon?: VNode<IClassName>;
  disabled?: boolean;
}

export function Button(props: IProps) {
  const handleOnClick = (e: TargetedEvent) => {
    if (!props.disabled && props.onClick) {
      props.onClick(e);
    }
  }

  return (
    <button onClick={handleOnClick} className={cls(styles.button, props.disabled && styles.disabled, props.className)}>
      {props.icon && cloneElement(props.icon, {className: cls(props.icon.props.className, styles.icon)})}
      {props.children}
    </button>
  )
}