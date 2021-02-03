import {h} from 'preact';
import styles from './index.scss';
import {cls, IClassName} from '~/utils/common';
import {JSXInternal} from 'preact/src/jsx';
import TargetedEvent = JSXInternal.TargetedEvent;


interface ISelectOption {
  label: string;
  value: number;
}

interface IProps extends Partial<IClassName> {
  options: ISelectOption[];
  onChange?: (newValue: number) => void;
  defaultValue?: number;
}

export function SelectInput(props: IProps) {
  const handleOnChange = (e: TargetedEvent) => {
    if (!props.onChange) return;

    const value = parseInt((e.target as HTMLSelectElement).value);
    props.onChange(value);
  }

  return (
    <select
      value={props.defaultValue}
      className={cls(styles.selectInput, props.className)}
      onChange={handleOnChange}
    >
      {props.options.map((it, idx) => <option key={idx} value={it.value}>{it.label}</option>)}
    </select>
  )
}