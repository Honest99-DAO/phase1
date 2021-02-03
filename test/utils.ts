import {HDKey} from 'wallet.ts';
import {mnemonicToSeed} from 'bip39';
import {BigNumber, BigNumberish, ContractReceipt, ContractTransaction, ethers, utils} from 'ethers';
import Web3 from 'web3';
import {
  Accountant, AccountantFactory,
  HonestCasino, HonestCasinoFactory, NineToken,
  NineTokenFactory,
  Registry, RegistryFactory,
  Voting, VotingFactory
} from '../types/ethers-contracts';
import {assert} from 'chai';
import {formatEther} from 'ethers/lib/utils';
import fetch from 'node-fetch';
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

  const tokenFactory = new NineTokenFactory(wallet);
  const token = await tokenFactory.deploy(wallet.address, wallet.address).then(it => it.deployed());
  const rec1 = await token.deployTransaction.wait();
  console.log(`Token contract deployed (${formatEther(rec1.gasUsed.mul(gasPrice))} ETH gas used)`);

  const casinoFactory = new HonestCasinoFactory(wallet);
  const casino = await casinoFactory.deploy().then(it => it.deployed());
  const rec2 = await casino.deployTransaction.wait();
  console.log(`Casino contract deployed (${formatEther(rec2.gasUsed.mul(gasPrice))} ETH gas used)`);

  const votingFactory = new VotingFactory(wallet);
  const voting = await votingFactory.deploy().then(it => it.deployed());
  const rec3 = await voting.deployTransaction.wait();
  console.log(`Voting contract deployed (${formatEther(rec3.gasUsed.mul(gasPrice))} ETH gas used)`);

  const accountantFactory = new AccountantFactory(wallet);
  const accountant = await accountantFactory.deploy().then(it => it.deployed());
  const rec4 = await accountant.deployTransaction.wait();
  console.log(`Accountant contract deployed (${formatEther(rec4.gasUsed.mul(gasPrice))} ETH gas used)`);

  const registryFactory = new RegistryFactory(wallet);
  const registry = await registryFactory.deploy(casino.address, voting.address, accountant.address, token.address).then(it => it.deployed());
  const rec5 = await registry.deployTransaction.wait();
  console.log(`Registry contract deployed (${formatEther(rec5.gasUsed.mul(gasPrice))} ETH gas used)`);

  const rec6 = await token.__initialSetRegistry(registry.address).then(it => it.wait());
  console.log(`Token contract linked to registry (${formatEther(rec6.gasUsed.mul(gasPrice))} ETH gas used)`);

  const rec7 = await casino.__initialSetRegistry(registry.address).then(it => it.wait());
  console.log(`Casino contract linked to registry (${formatEther(rec7.gasUsed.mul(gasPrice))} ETH gas used)`);

  const rec8 = await voting.__initialSetRegistry(registry.address).then(it => it.wait());
  console.log(`Voting contract linked to registry (${formatEther(rec8.gasUsed.mul(gasPrice))} ETH gas used)`);

  const rec9 = await accountant.__initialSetRegistry(registry.address).then(it => it.wait());
  console.log(`Accountant contract linked to registry (${formatEther(rec9.gasUsed.mul(gasPrice))} ETH gas used)`);

  const totalGasUsed = (rec1.gasUsed.add(rec2.gasUsed).add(rec3.gasUsed).add(rec4.gasUsed).add(rec5.gasUsed).add(rec6.gasUsed).add(rec7.gasUsed).add(rec8.gasUsed).add(rec9.gasUsed)).mul(gasPrice);
  console.log(`Initial deployment complete (total ${formatEther(totalGasUsed)} ETH gas used, ${formatEther(gasPrice)} ETH gas price)`);

  assert((await registry.getAccountant()) == accountant.address, 'Accountant registry address is incorrect');
  assert((await registry.getCasino()) == casino.address, 'Casino registry address is incorrect');
  assert((await registry.getNineToken()) == token.address, 'Token registry address is incorrect');
  assert((await registry.getVoting()) == voting.address, 'Voting registry address is incorrect');

  return {casino, token, voting, accountant, registry};
}

export interface IDeployment {
  casino: HonestCasino;
  token: NineToken;
  voting: Voting;
  accountant: Accountant;
  registry: Registry;
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

export function etherToWei(ether: BigNumberish): BigNumber {
  return BigNumber.from(ether).mul(ETHER_WEI_FACTOR);
}

export function logAmount(num: BigNumberish, prefix: string = '', postfix: string = EtherUnit.ETHER) {
  console.log(prefix + ' ' + formatEther(num) + ' ' + postfix);
}

export async function _evmIncreaseTime(secs: number, endpoint: string = 'http://localhost:8545'): Promise<any> {
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: 1337,
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [secs]
    })
  });
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

export function ethTimestampNow(): number {
  return Math.floor(new Date().getTime() / 1000);
}

export const ONE_DAY = 60 * 60 * 24 + 1;
export const THIRTY_DAYS = ONE_DAY * 30 + 1;