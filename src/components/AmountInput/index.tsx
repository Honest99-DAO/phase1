import {BigNumber} from 'ethers';
import {cls, EtherUnit, etherUnits, IClassName, JoiUnit, joiUnits, joiUnitToEtherUnit} from '~/utils/common';
import {JSXInternal} from 'preact/src/jsx';
import {Input} from '~/components/Input';
import {h} from 'preact';
import {useState} from 'preact/hooks';
import styles from './index.scss';
import {parseEther, parseUnits} from 'ethers/lib/utils';
import TargetedEvent = JSXInternal.TargetedEvent;


interface IProps extends Partial<IClassName> {
  defaultValue?: BigNumber;
  max?: BigNumber;
  min?: BigNumber;
  onChange?: (newValue: BigNumber) => void;
  onUnitChange?: (newUnit: EtherUnit | JoiUnit) => void;
  placeholder?: string;
  type?: 'eth' | 'joi';
}


export function AmountInput(props: IProps) {
  const type = props.type || 'eth';
  const units: string[] = type == 'eth' ? etherUnits() : joiUnits();

  const [rawValue, setRawValue] = useState(props.defaultValue?.toString() || '');

  const [currentUnit, setCurrentUnit] = useState(type == 'eth' ? EtherUnit.ETHER : JoiUnit.Joi);
  const handleOnUnitSelect = (e: TargetedEvent<HTMLSelectElement>) => {
    const newUnit = (e.target as HTMLSelectElement).value as JoiUnit;

    setCurrentUnit(newUnit);
    setRawValue('');
    if (props.onChange) {
      props.onChange(BigNumber.from(0));
    }
    if (props.onUnitChange) {
      props.onUnitChange(newUnit)
    }
  };

  const currentUnitConverted: EtherUnit = type == 'eth'
    ? currentUnit as EtherUnit
    : joiUnitToEtherUnit(currentUnit as JoiUnit);

  const pattern = currentUnitConverted == EtherUnit.ETHER
    ? '[0-9]+\.?[0-9]*'
    : '[0-9]+';

  const centSelect = (
    <select
      value={currentUnit}
      onChange={handleOnUnitSelect}
      className={styles.select}
    >
      {
        units.map((it, idx) => <option key={idx} value={it}>{it}</option>)
      }
    </select>
  );

  const handleValueChange = (_newValue: string): void => {
    if (!props.onChange) return;

    try {
      const newValue = _newValue.trim() || '0';
      let parsedValue: BigNumber;

      if (currentUnitConverted == EtherUnit.ETHER) {
        parsedValue = parseEther(newValue);
      } else {
        parsedValue = parseUnits(newValue, currentUnitConverted);
      }

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
      icon={centSelect}
    />
  );
}