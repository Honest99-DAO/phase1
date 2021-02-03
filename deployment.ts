import {HDKey} from 'wallet.ts';
import {mnemonicToSeed} from 'bip39';
import {ethers} from 'ethers';
import Web3 from 'web3';
import {HonestCasino, HonestCasinoFactory} from './types/ethers-contracts';
import {formatEther} from 'ethers/lib/utils';


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

async function deployment(wallet: ethers.Wallet): Promise<IDeployment> {

  console.log('Deployment started');
  console.log(NETWORK, ETH_ENDPOINT, wallet.address);

  const gasPrice = await wallet.provider.getGasPrice();

  const casinoFactory = new HonestCasinoFactory(wallet);
  const casino = await casinoFactory.deploy().then(it => it.deployed());
  const rec2 = await casino.deployTransaction.wait();
  console.log(`Casino contract deployed (${formatEther(rec2.gasUsed.mul(gasPrice))} ETH gas used)`, casino.address);

  return {casino};
}

interface IDeployment {
  casino: HonestCasino;
}


createWallets().then(async wallets => {
  await deployment(wallets[0]);
});