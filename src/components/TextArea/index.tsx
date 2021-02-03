import {h, VNode} from 'preact';
import styles from './index.scss';
import {cls, IClassName} from '~/utils/common';
import {JSXInternal} from 'preact/src/jsx';
import TargetedEvent = JSXInternal.TargetedEvent;
import {useEffect, useRef, useState} from 'preact/hooks';


interface IProps extends Partial<IClassName> {
  value?: string;
  onChange?: (newValue: string) => void;
  placeholder?: string;
}

/*
 * This input uses pattern to validate prevent bad inputs in real time
 */
export function TextArea(props: IProps) {
  const ref = useRef<HTMLTextAreaElement>();

  const handleOnChange = (e: TargetedEvent) => {
    if (!props.onChange) return;

    const newValue = (e.target as HTMLInputElement).value;
    props.onChange(newValue);

    resize();
  };

  const resize = () => {
    ref.current.style.height = "";
    ref.current.style.height = ref.current.scrollHeight + 12 + 'px';
  };

  useEffect(() => {
    resize()
  }, []);

  return (
    <textarea
      ref={ref}
      onChange={handleOnChange}
      value={props.value}
      placeholder={props.placeholder}
      className={cls(styles.textarea, props.className)}
    />
  )
}