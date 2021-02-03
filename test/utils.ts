import {HDKey} from 'wallet.ts';
import {mnemonicToSeed} from 'bip39';
import {BigNumber, BigNumberish, ContractReceipt, ContractTransaction, ethers, utils} from 'ethers';
import Web3 from 'web3';
import {HonestCasino, HonestCasinoFactory} from '../types/ethers-contracts';
import {assert} from 'chai';
import {formatEther} from 'ethers/lib/utils';
import {EtherUnit} from '../src/utils/common';


export const ETH_ENDPOINT = 'http://localhost:8545';

export async function createAdminWallets(): Promise<HDKey[]> {
  const seed = await mnemonicToSeed('zebra grant load arctic broken broom first timber peasant lizard purse ride');
  const masterKey = HDKey.parseMasterSeed(seed);

  const {extendedPrivateKey} = masterKey.derive('m/44\'/60\'/0\'/0');
  const childKey = HDKey.parseExtendedKey(extendedPrivateKey!);
  const wallets: HDKey[] = [];
  for (let i = 0; i < 10; i++) {
    const wallet = childKey.derive(`${i}`);
    wallets.push(wallet);
  }

  return wallets;
}

export async function createWallets(): Promise<ethers.Wallet[]> {
  const wallets = await createAdminWallets();
  // @ts-ignore
  const provider = new ethers.providers.Web3Provider(new Web3.providers.HttpProvider(ETH_ENDPOINT));

  return wallets.map(wallet => new ethers.Wallet(wallet.privateKey!, provider));
}

export async function initialDeployment(wallet: ethers.Wallet): Promise<IDeployment> {

  console.log('Initial deployment started');

  const gasPrice = await wallet.provider.getGasPrice();

  const casinoFactory = new HonestCasinoFactory(wallet);
  const casino = await casinoFactory.deploy().then(it => it.deployed());
  const rec2 = await casino.deployTransaction.wait();
  console.log(`Casino contract deployed (${formatEther(rec2.gasUsed.mul(gasPrice))} ETH gas used)`);

  return {casino};
}

export interface IDeployment {
  casino: HonestCasino;
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function assertTxThrows(func: () => Promise<ContractTransaction>, message: string = '') {
  try {
    const tx = await func();
    await tx.wait();
    throw null;
  } catch (e) {
    if (e == null) {
      assert(false, `Tx did not threw: [${message}]`)
    }

    console.log(`Thrown as expected: [${message}] - ${e.reason || e.message}`);
  }
}

export const ETHER_WEI_FACTOR = BigNumber.from(10).pow(18);

export function logAmount(num: BigNumberish, prefix: string = '', postfix: string = EtherUnit.ETHER) {
  console.log(prefix + ' ' + formatEther(num) + ' ' + postfix);
}

export interface IGuess {
  sender: string;
  bet: BigNumber;
  number: number;
  randomNumber: number;
}

export function parseGuess(rec: ContractReceipt): IGuess {
  const guessEvent: [string, BigNumber, number, number] = txnReceiptParseEvent(rec);

  return {
    sender: guessEvent[0],
    bet: guessEvent[1],
    number: guessEvent[3],
    randomNumber: calculateRandomNumber(rec.blockHash, guessEvent[2])
  };
}

export function txnReceiptParseEvent<T>(rec: ContractReceipt): T {
  // @ts-ignore
  return rec.events[0].args;
}

export function calculateRandomNumber(blockHash: string, nonce: number): number {
  const hashStr = utils.solidityKeccak256(['bytes32', 'uint16'], [blockHash, nonce]);
  const number = BigNumber.from(hashStr);

  return number.mod(100).toNumber();
}

export const ONE_DAY = 60 * 60 * 24 + 1;
export const THIRTY_DAYS = ONE_DAY * 30 + 1;