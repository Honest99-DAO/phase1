import fetch from 'node-fetch';
import {THIRTY_DAYS} from '~/utils/common';
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

declare global {
  interface Window {
    _evmIncreaseTime: (secs: number) => Promise<void>;
    THIRTY_DAYS: number;
  }
}

if (CONFIG.network == SUPPORTED_NETWORKS.DEV) {
  window._evmIncreaseTime = async function (secs: number, endpoint: string = 'http://localhost:8545'): Promise<any> {
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
  };

  window.THIRTY_DAYS = THIRTY_DAYS;
}

export const injected = new InjectedConnector({ supportedChainIds: [1337] })

export const walletconnect = new WalletConnectConnector({
  rpc: { 1337: ETH_ENDPOINT },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: 12000
})