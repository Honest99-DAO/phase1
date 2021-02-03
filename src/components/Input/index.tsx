import {h, VNode} from 'preact';
import styles from './index.scss';
import {cls, IClassName} from '~/utils/common';
import {JSXInternal} from 'preact/src/jsx';
import TargetedEvent = JSXInternal.TargetedEvent;
import {useRef, useState} from 'preact/hooks';


interface IProps extends Partial<IClassName> {
  value?: string;
  onChange?: (newValue: string) => void;
  placeholder?: string;
  pattern?: string;
  icon?: VNode;
}

/*
 * This input uses pattern to validate prevent bad inputs in real time
 */
export function Input(props: IProps) {
  const ref = useRef<HTMLInputElement>();
  const [prevValue, setPrevValue] = useState('');

  const handleOnChange = (e: TargetedEvent) => {
    if (!props.onChange) return;

    const newValue = (e.target as HTMLInputElement).value;

    if (!ref.current.checkValidity()) {
      ref.current.value = prevValue;
      return;
    }

    props.onChange(newValue);
    setPrevValue(newValue);
  };

  return (
    <div className={cls(styles.inputWrapper, props.className)}>
      <input
        ref={ref}
        pattern={props.pattern}
        onChange={handleOnChange}
        value={props.value}
        placeholder={props.placeholder}
        type='text'
        className={styles.input}
      />
      {props.icon}
    </div>
  )
}