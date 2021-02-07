import {HDKey} from 'wallet.ts';
import {mnemonicToSeed} from 'bip39';
import {BigNumber, ethers} from 'ethers';
import Web3 from 'web3';
import {HonestCasino, HonestCasinoFactory} from './types/ethers-contracts';
import {formatEther, parseEther} from 'ethers/lib/utils';
import {CONFIG, SUPPORTED_NETWORKS} from './src/config';
import {parseGuess} from './src/utils/common';


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

  if (CONFIG.network == SUPPORTED_NETWORKS.DEV) {
    await wallet.sendTransaction({value: parseEther('1'), to: casino.address}).then(it => it.wait());

    let fees = BigNumber.from(0);
    let wins = 0;
    let i = 0;
    while (wins < 5) {
      i++;

      const betHardCap = parseEther('200');
      const prizeFund = await casino.provider.getBalance(casino.address);
      const prizeMultiplier = await casino.prizeMultiplier();

      let maxBetSize: BigNumber;
      if (betHardCap.lt(prizeFund.div(2))) {
        maxBetSize = betHardCap.div(prizeMultiplier);
      } else {
        maxBetSize = prizeFund.div(2).div(prizeMultiplier)
      }

      const rec = await casino.guess(Math.floor(Math.random() * 100), {value: maxBetSize}).then(it => it.wait());
      const guess = parseGuess(rec);

      if (guess.number == guess.randomNumber) {
        wins++;

        fees = fees.add(maxBetSize.mul(prizeMultiplier).mul(3).div(100));

        console.log(
          `Try #${i}`,
          `Prize fund before win #${wins}: ${formatEther(prizeFund)} ETH`,
          `Winning number - ${guess.number}`,
          `Max bet size - ${formatEther(maxBetSize)} ETH`
        );

        if (wins < 5)
          await casino.claimPrize(wallet.address).then(it => it.wait());
      }
    }

    const prizeFundAfter = await wallet.provider.getBalance(casino.address);

    console.log(`The prize fund after ${wins} wins and ${i} guesses: ${formatEther(prizeFundAfter)} ETH`);
    console.log(`Total fees collected: ${formatEther(fees)} ETH`);
  }

  return {casino};
}

interface IDeployment {
  casino: HonestCasino;
}


createWallets().then(async wallets => {
  await deployment(wallets[0]);
});