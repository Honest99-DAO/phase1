import fetch from 'node-fetch';
import {THIRTY_DAYS} from '~/utils/common';

export enum SUPPORTED_NETWORKS {
  DEV = 'dev'
}

export interface IConfig {
  network: SUPPORTED_NETWORKS;
  chainId: number;
  registryContractAddress: string;
  mainGithubUrl: string;
  discussionUrl: string;
}

export const CONFIG: IConfig = {
  network: SUPPORTED_NETWORKS.DEV,
  chainId: 1337,

  registryContractAddress: '0x50A6B81B7Cf2478179D5FDF12fE97F4D9865F450',

  mainGithubUrl: 'https://github.com/seniorjoinu/honest-casino',
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