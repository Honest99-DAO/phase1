import {IClassName} from '~/utils/common';
import {h} from 'preact';

interface IProps extends Partial<IClassName> {
  src: string;
  alt?: string;
  onClick?: () => void;
}

export function Icon(props: IProps) {
  return <img onClick={props.onClick} className={props.className} src={props.src} alt={props.alt} />
}