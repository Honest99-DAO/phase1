import {IClassName} from '~/utils/common';
import {h} from 'preact';
import LoaderSvg from '~/public/loader.svg';
import {JSXInternal} from 'preact/src/jsx';
import CSSProperties = JSXInternal.CSSProperties;


interface IProps extends Partial<IClassName> {
  style?: CSSProperties
}

export function Loader(props: IProps) {
  return <img style={props.style} className={props.className} src={LoaderSvg} alt='Loading...'/>
}