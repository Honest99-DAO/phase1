import {cls, IClassName} from '~/utils/common';
import {Input} from '~/components/Input';
import {h, VNode} from 'preact';
import {useState} from 'preact/hooks';
import styles from './index.scss';
import {BigNumber} from 'ethers';


interface IProps extends Partial<IClassName> {
  defaultValue?: BigNumber;
  max?: BigNumber;
  min?: BigNumber;
  onChange?: (newValue: BigNumber) => void;
  placeholder?: string;
  icon?: VNode;
}

const pattern = '[0-9]*';

export function UintInput(props: IProps) {
  const [value, setValue] = useState(props.defaultValue);

  const handleValueChange = (_newValue: string): void => {
    if (!props.onChange) return;

    const newValue = BigNumber.from(_newValue);

    if (props.max && newValue.gt(props.max)) return;
    if (props.min && newValue.lt(props.min)) return;

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
      icon={props.icon}
    />
  );
}