import {cls, IClassName, randomInt} from '~/utils/common';
import {h} from 'preact';
import styles from './index.scss';
import {useEffect, useState} from 'preact/hooks';


interface IProps extends Partial<IClassName> {
  number?: number;
  min: number;
  max: number;
}

export function NumberBar(props: IProps) {
  const generateRandom = () => randomInt(props.min || 0, props.max || 100);
  const [currentNumber, setCurrentNumber] = useState(generateRandom());
  const [int, setInt] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (int) {
      clearInterval(int);
    }

    if (props.number != undefined) {
      setCurrentNumber(props.number);
    } else {
      const newInt = setInterval(() => setCurrentNumber(generateRandom()), 100);
      setInt(newInt);
    }
  }, [props.number]);

  return (
    <div className={cls(styles.numberBar, props.className)}>
      <p className={cls(props.number == undefined && styles.spinning)}>{currentNumber}</p>
    </div>
  )
}