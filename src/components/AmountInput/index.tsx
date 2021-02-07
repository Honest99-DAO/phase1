import {BigNumber} from 'ethers';
import {cls, IClassName} from '~/utils/common';
import {Input} from '~/components/Input';
import {h} from 'preact';
import {useState} from 'preact/hooks';
import styles from './index.scss';
import {parseEther} from 'ethers/lib/utils';


interface IProps extends Partial<IClassName> {
  value?: string;
  onChange: (newValue: BigNumber) => void;
  max?: BigNumber;
  min?: BigNumber;
  placeholder?: string;
  label?: string;
}


export function AmountInput(props: IProps) {
  const [rawValue, setRawValue] = useState(props.value?.trim());

  const pattern = '[0-9]+\.?[0-9]*';

  const handleValueChange = (_newValue: string): void => {
    if (!props.onChange) return;

    try {
      const newValue = _newValue.trim() || '0';
      let parsedValue: BigNumber;

      parsedValue = parseEther(newValue);

      // validate
      if (props.max && parsedValue.gt(props.max)) return;
      if (props.min && parsedValue.lt(props.min)) return;

      props.onChange(parsedValue);
      setRawValue(_newValue.trim());

    } catch (err) {
      return;
    }

    return;
  };

  return (
    <Input
      pattern={pattern}
      value={rawValue}
      onChange={handleValueChange}
      className={cls(styles.amountInput, props.className)}
      placeholder={props.placeholder}
      icon={props.label ? <span className={styles.label}>{props.label}</span> : undefined}
    />
  );
}