import {IClassName} from '~/utils/common';
import {h} from 'preact';
import LoaderSvg from '~/public/loader.svg';


interface IProps extends Partial<IClassName> {
}

export function Loader(props: IProps) {
  return <img className={props.className} src={LoaderSvg} alt='Loading...'/>
}