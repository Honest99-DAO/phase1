import {InjectedConnector} from '@web3-react/injected-connector';
import {WalletConnectConnector} from '@web3-react/walletconnect-connector';
import {ETH_ENDPOINT} from '../test/utils';

export enum SUPPORTED_NETWORKS {
  DEV = 'dev'
}

export interface IConfig {
  network: SUPPORTED_NETWORKS;
  chainId: number;
  casinoContractAddress: string;
  mainGithubUrl: string;
  discussionUrl: string;
}

export const CONFIG: IConfig = {
  network: SUPPORTED_NETWORKS.DEV,
  chainId: 1337,

  casinoContractAddress: '0xb7E503c42DaCfC9189d8B2e50Ff47Fcc22aA3b5c',

  mainGithubUrl: 'https://github.com/Casino-Honest-99/phase1',
  discussionUrl: 'https://t.me/honestcasinochat'
}

export const injected = new InjectedConnector({ supportedChainIds: [1337] });

export const walletconnect = new WalletConnectConnector({
  rpc: { 1337: ETH_ENDPOINT },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: 12000
})