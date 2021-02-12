import {InjectedConnector} from '@web3-react/injected-connector';
import {WalletConnectConnector} from '@web3-react/walletconnect-connector';


export enum SUPPORTED_NETWORKS {
  MAINNET = 1,
  KOVAN = 42,
  DEV = 1337
}

export interface IConfig {
  chainId?: SUPPORTED_NETWORKS;
  mnemonic?: string;

  casinoContractAddress: {[key in SUPPORTED_NETWORKS]: string};
  mainGithubUrl: string;
  discussionUrl: string;
}

export const CONFIG: IConfig = {
  chainId: parseInt(process.env.CHAIN_ID || '0'),
  mnemonic: process.env.MNEMONIC,

  casinoContractAddress: {
    [SUPPORTED_NETWORKS.DEV]: '0xb7E503c42DaCfC9189d8B2e50Ff47Fcc22aA3b5c',
    [SUPPORTED_NETWORKS.KOVAN]: '0x3EAbdCFd8DbD4e0569ca695A7098ce3AB3d9f5b5',
    [SUPPORTED_NETWORKS.MAINNET]: '0x952E377BD52E35A507d87259658Cf424390a65f7'
  },
  mainGithubUrl: 'https://github.com/Casino-Honest-99/phase1',
  discussionUrl: 'https://twitter.com/Joinu9'
}

export const RPCs = {
  [SUPPORTED_NETWORKS.MAINNET]: 'https://mainnet.infura.io/v3/e8583f0e6bbd4fb1b11ab7489c62d31f',
  [SUPPORTED_NETWORKS.KOVAN]: 'https://kovan.infura.io/v3/e8583f0e6bbd4fb1b11ab7489c62d31f',
  [SUPPORTED_NETWORKS.DEV]: 'http://localhost:8545'
}

export const injected = new InjectedConnector({
  supportedChainIds: [SUPPORTED_NETWORKS.DEV, SUPPORTED_NETWORKS.KOVAN, SUPPORTED_NETWORKS.MAINNET]
});

if (!CONFIG.chainId) throw new Error('CHAIN_ID is not found in .env');

export const walletconnect = new WalletConnectConnector({
  rpc: {[CONFIG.chainId]: RPCs[CONFIG.chainId]},
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: 12000
})