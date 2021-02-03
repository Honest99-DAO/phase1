import {ComponentChildren} from 'preact';
import {BigNumber} from 'ethers';
import {formatEther, parseEther} from 'ethers/lib/utils';
import {Connectors} from 'use-wallet';


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

export enum JoiUnit {
  attoJoi = 'atto Joi', // 10^0
  femtoJoi = 'femto Joi', // 10^3
  picoJoi = 'pico Joi', // 10^6
  nanoJoi = 'nano Joi', // 10^9
  microJoi = 'micro Joi', // 10^12
  milliJoi = 'milli Joi', // 10^15
  Joi = 'Joi' // 10^18
}

export function joiUnits(): JoiUnit[] {
  return [JoiUnit.attoJoi, JoiUnit.femtoJoi, JoiUnit.picoJoi, JoiUnit.nanoJoi, JoiUnit.microJoi, JoiUnit.milliJoi, JoiUnit.Joi];
}

export function etherUnitToJoiUnit(unit: EtherUnit): JoiUnit {
  switch (unit) {
    case EtherUnit.ETHER:
      return JoiUnit.Joi;
    case EtherUnit.FINNEY:
      return JoiUnit.milliJoi;
    case EtherUnit.SZABO:
      return JoiUnit.microJoi;
    case EtherUnit.GWEI:
      return JoiUnit.nanoJoi;
    case EtherUnit.MWEI:
      return JoiUnit.picoJoi;
    case EtherUnit.KWEI:
      return JoiUnit.femtoJoi;
    case EtherUnit.WEI:
      return JoiUnit.attoJoi;
  }
}

export function joiUnitToEtherUnit(unit: JoiUnit): EtherUnit {
  switch (unit) {
    case JoiUnit.Joi:
      return EtherUnit.ETHER;
    case JoiUnit.milliJoi:
      return EtherUnit.FINNEY;
    case JoiUnit.microJoi:
      return EtherUnit.SZABO;
    case JoiUnit.nanoJoi:
      return EtherUnit.GWEI;
    case JoiUnit.picoJoi:
      return EtherUnit.MWEI;
    case JoiUnit.femtoJoi:
      return EtherUnit.KWEI;
    case JoiUnit.attoJoi:
      return EtherUnit.WEI;
  }
}

export function randomInt(from: number, to: number): number {
  return Math.floor(Math.random() * (to - from) + from);
}

export function calcEtherShare(part: BigNumber, total: BigNumber): number {
  const partFloat = parseFloat(formatEther(part));
  const totalFloat = parseFloat(formatEther(total));

  return partFloat / totalFloat * 100;
}

export function linkToContract(address: string): string {
  return `https://etherscan.io/address/${address}`;
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

export function setWalletConnected(value: keyof Connectors | null) {
  localStorage.setItem('__WALLET_CONNECTED', JSON.stringify(value));
}

export function isWalletConnected(): keyof Connectors | null {
  const val = localStorage.getItem('__WALLET_CONNECTED');

  return val ? JSON.parse(val) : null;
}

export const MAX_MINTED = parseEther('10000');
export const FOUNDER_REWARD = parseEther('2000');
export const ONE_DAY = 60 * 60 * 24 + 1;
export const THIRTY_DAYS = ONE_DAY * 30 + 1;