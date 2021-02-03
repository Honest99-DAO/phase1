import {BigNumber} from 'ethers';
import {h} from 'preact';
import styles from './index.scss';
import {calcEtherShare, cls, IClassName, shrinkUnits} from '~/utils/common';
import {formatEther} from 'ethers/lib/utils';


export interface IDistributionEntry {
  value: BigNumber;
  color: string;
  legend: string;
}

interface IProps extends Partial<IClassName> {
  entries: IDistributionEntry[];
  legend?: boolean;
  simple?: boolean;
  forceTextColor?: string;
  postfixLength?: number;
}

export function Distribution(props: IProps) {
  const simple = props.simple || false;
  const legend = props.legend || false;

  const renderEntries = () => props.entries.map((it, idx) => {
    const total = props.entries.reduce((prev, cur) => prev.add(cur.value), BigNumber.from(0));
    const empty = total.eq(0);

    const share = calcEtherShare(it.value, total);
    const textColor = props.forceTextColor
      ? props.forceTextColor
      : simple ? 'white' : it.color;

    const style = {
      backgroundColor: simple ? 'transparent' : it.color,
      borderBottom: simple ? `2px solid ${it.color}` : 'none',
      height: simple ? '1em' : '50px',
      width: simple || empty ? '100%' : `${share.toPrecision(2)}%`,
      zIndex: (100 - share),
      color: textColor
    };

    return (
      <div
        key={idx}
        className={cls(styles.entry)}
        style={style}
      >
        {
          (share > 10 || simple || empty) && (
            <p style={{mixBlendMode: props.forceTextColor ? 'normal' : 'difference'}}>
              {shrinkUnits(formatEther(it.value), props.postfixLength || 2)}
            </p>
          )
        }
      </div>
    );
  });

  const renderLegend = () => props.entries.map((it, idx) =>
    <div key={idx} className={styles.legendEntry}>
      <span style={{backgroundColor: it.color}} className={styles.legendColor}/>
      <p>{it.legend}</p>
    </div>
  );

  return (
    <div className={cls(styles.distribution, props.className, simple && styles.simple)}>
      <div className={styles.entries}>
        {renderEntries()}
      </div>
      {
        legend && (
          <div className={styles.legend}>
            {renderLegend()}
          </div>
        )
      }
    </div>
  );
}