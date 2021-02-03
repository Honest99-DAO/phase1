import {HDKey} from 'wallet.ts';
import {mnemonicToSeed} from 'bip39';
import {ethers} from 'ethers';
import Web3 from 'web3';
import {
  Accountant,
  AccountantFactory,
  HonestCasino,
  HonestCasinoFactory, NineToken, NineTokenFactory,
  Registry,
  RegistryFactory,
  Voting,
  VotingFactory
} from './types/ethers-contracts';
import {formatEther} from 'ethers/lib/utils';
import {assert} from "chai";


const NETWORK = 'development';
const ETH_ENDPOINT = 'http://localhost:8545';
const MNEMONIC = 'zebra grant load arctic broken broom first timber peasant lizard purse ride';

async function createAdminWallets(): Promise<HDKey[]> {
  const seed = await mnemonicToSeed(MNEMONIC);
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

async function createWallets(): Promise<ethers.Wallet[]> {
  const wallets = await createAdminWallets();
  // @ts-ignore
  const provider = new ethers.providers.Web3Provider(new Web3.providers.HttpProvider(ETH_ENDPOINT));

  return wallets.map(wallet => new ethers.Wallet(wallet.privateKey!, provider));
}

async function deploymentPhase2(wallet: ethers.Wallet): Promise<IDeployment> {

  console.log('Deployment started');
  console.log(NETWORK, ETH_ENDPOINT, wallet.address);

  const gasPrice = await wallet.provider.getGasPrice();

  const tokenFactory = new NineTokenFactory(wallet);
  const token = await tokenFactory.deploy(wallet.address, wallet.address).then(it => it.deployed());
  const rec1 = await token.deployTransaction.wait();
  console.log(`Token contract deployed (${formatEther(rec1.gasUsed.mul(gasPrice))} ETH gas used)`, token.address);

  const casinoFactory = new HonestCasinoFactory(wallet);
  const casino = await casinoFactory.deploy().then(it => it.deployed());
  const rec2 = await casino.deployTransaction.wait();
  console.log(`Casino contract deployed (${formatEther(rec2.gasUsed.mul(gasPrice))} ETH gas used)`, casino.address);

  const votingFactory = new VotingFactory(wallet);
  const voting = await votingFactory.deploy().then(it => it.deployed());
  const rec3 = await voting.deployTransaction.wait();
  console.log(`Voting contract deployed (${formatEther(rec3.gasUsed.mul(gasPrice))} ETH gas used)`, voting.address);

  const accountantFactory = new AccountantFactory(wallet);
  const accountant = await accountantFactory.deploy().then(it => it.deployed());
  const rec4 = await accountant.deployTransaction.wait();
  console.log(`Accountant contract deployed (${formatEther(rec4.gasUsed.mul(gasPrice))} ETH gas used)`, accountant.address);

  const registryFactory = new RegistryFactory(wallet);
  const registry = await registryFactory.deploy(casino.address, voting.address, accountant.address, token.address).then(it => it.deployed());
  const rec5 = await registry.deployTransaction.wait();
  console.log(`Registry contract deployed (${formatEther(rec5.gasUsed.mul(gasPrice))} ETH gas used)`, registry.address);

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

interface IDeployment {
  casino: HonestCasino;
  token: NineToken;
  voting: Voting;
  accountant: Accountant;
  registry: Registry;
}

createWallets().then(async wallets => {
  await deploymentPhase2(wallets[0]);
});