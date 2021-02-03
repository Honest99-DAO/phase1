import {cls, IClassName} from '~/utils/common';
import {Input} from '~/components/Input';
import {h} from 'preact';
import {useState} from 'preact/hooks';
import styles from './index.scss';


interface IProps extends Partial<IClassName> {
  defaultValue?: number;
  max?: number;
  min?: number;
  onChange?: (newValue: number) => void;
  placeholder?: string;
}

const pattern = '[0-9]*';

export function DaysInput(props: IProps) {
  const [value, setValue] = useState(props.defaultValue);

  const handleValueChange = (_newValue: string): void => {
    if (!props.onChange) return;

    let newValue = parseInt(_newValue);
    if (isNaN(newValue)) {
      newValue = value || 0;
    }

    if (props.max && props.max < newValue) return;
    if (props.min && props.min > newValue) return;

    setValue(newValue);
    props.onChange(newValue);
  };

  return (
    <Input
      pattern={pattern}
      value={value?.toString() || ''}
      onChange={handleValueChange}
      className={cls(styles.amountInput, props.className)}
      placeholder={props.placeholder}
      icon={<span className={styles.label}>days</span>}
    />
  );
}