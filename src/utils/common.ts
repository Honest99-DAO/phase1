import {ComponentChildren} from 'preact';


export interface IClassName {
  className: string;
}

export interface IChildren {
  children: ComponentChildren;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function cls(...classNames: (string | undefined | null | false)[]): string {
  return classNames.filter(it => !!it).join(' ');
}

export function shrinkAddress(addr: string): string {
  return `${addr.slice(0, 4)}..${addr.slice(40)}`;
}

export function shrinkUnits(value: string, postfixLength: number = 3): string {
  const dotIndex = value.indexOf('.');
  return `${value.slice(0, dotIndex + 1 + postfixLength)}`;
}

export enum EtherUnit {
  WEI = 'wei', // 10^0
  KWEI = 'kwei', // 10^3
  MWEI = 'mwei', // 10^6
  GWEI = 'gwei', // 10^9
  SZABO = 'szabo', // 10^12
  FINNEY = 'finney', // 10^15
  ETHER = 'ether' // 10^18
}

export function etherUnits(): EtherUnit[] {
  return [EtherUnit.WEI, EtherUnit.KWEI, EtherUnit.MWEI, EtherUnit.GWEI, EtherUnit.SZABO, EtherUnit.FINNEY, EtherUnit.ETHER];
}

export function randomInt(from: number, to: number): number {
  return Math.floor(Math.random() * (to - from) + from);
}

export function linkToContract(address: string): string {
  return `https://etherscan.io/address/${address}`;
}

export function linkToTx(txHash: string): string {
  return `https://etherscan.io/tx/${txHash}`;
}

export function capitalize(str: string) {
  if (!str) return str;

  return str[0].toUpperCase() + str.slice(1);
}

export function plural(count: number, one: string, two: string, five: string): string {
  const normalCount = count % 10;
  if (normalCount == 1) return one;
  if (normalCount > 1 && normalCount < 5) return two;
  return five;
}


export class Channel<T> {
  private buckets: T[][] = [];

  public write(msg: T) {
    this.buckets.forEach(bucket => bucket.push(msg));
  }

  public read(): () => Promise<T> {
    const bucket: T[] = [];
    this.buckets.push(bucket);

    return async () => {
      while (true) {
        const obj = bucket.shift();
        if (obj) return obj;

        await delay(10);
      }
    }
  }
}