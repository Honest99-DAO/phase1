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

  casinoContractAddress: '0x0711da5ce9c1D67681535b73b03E532Ae47a37e5',

  mainGithubUrl: 'https://github.com/Casino-Honest-99/phase1',
  discussionUrl: 'https://t.me/honestcasinochat'
}

export const injected = new InjectedConnector({ supportedChainIds: [1337] })

export const walletconnect = new WalletConnectConnector({
  rpc: { 1337: ETH_ENDPOINT },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: 12000
})