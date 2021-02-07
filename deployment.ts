import dotenv from 'dotenv';
dotenv.config();

import {HDKey} from 'wallet.ts';
import {mnemonicToSeed} from 'bip39';
import {ethers} from 'ethers';
import Web3 from 'web3';
import {HonestCasino, HonestCasinoFactory} from './types/ethers-contracts';
import {formatEther, parseEther} from 'ethers/lib/utils';
import {CONFIG, RPCs, SUPPORTED_NETWORKS} from './src/config';


async function createAdminWallets(mnemonic: string | undefined): Promise<HDKey[]> {
  if (!mnemonic) throw new Error('No MNEMONIC found in .env');

  const seed = await mnemonicToSeed(mnemonic);
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

async function createWallets(mnemonic: string | undefined): Promise<ethers.Wallet[]> {
  const wallets = await createAdminWallets(mnemonic);
  // @ts-ignore
  const provider = new ethers.providers.Web3Provider(new Web3.providers.HttpProvider(RPCs[CONFIG.chainId]));

  return wallets.map(wallet => new ethers.Wallet(wallet.privateKey!, provider));
}

async function deployment(wallet: ethers.Wallet): Promise<IDeployment> {
  if (!CONFIG.chainId) throw new Error('CHAIN_ID is not found in .env');

  console.log('Deployment started');
  console.log(CONFIG.chainId, RPCs[CONFIG.chainId], wallet.address);

  const gasPrice = await wallet.provider.getGasPrice();

  const casinoFactory = new HonestCasinoFactory(wallet);
  const casino = await casinoFactory.deploy().then(it => it.deployed());
  const rec2 = await casino.deployTransaction.wait();
  console.log(`Casino contract deployed (${formatEther(rec2.gasUsed.mul(gasPrice))} ETH gas used)`, casino.address);
  console.log(`Casino's owner is: ${wallet.address}`);

  if (CONFIG.chainId == SUPPORTED_NETWORKS.DEV) {
    await wallet.sendTransaction({to: '0xd1873EAE6cD81EE44bcF56C80f2376F59989AE47', value: parseEther('100')})
  }

  return {casino};
}

interface IDeployment {
  casino: HonestCasino;
}


createWallets(process.env.MNEMONIC).then(async wallets => {
  await deployment(wallets[0]);
});