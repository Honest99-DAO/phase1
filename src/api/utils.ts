import {providers} from 'ethers';
import {CONFIG, SUPPORTED_NETWORKS} from '~/config';

let _provider: providers.Provider | null;
export function getProvider(): providers.Provider {
  if (_provider != null) return _provider;

  switch (CONFIG.network) {
    case SUPPORTED_NETWORKS.DEV:
      _provider = new providers.JsonRpcProvider('http://localhost:8545');
      break;

    default:
      throw new Error('Unsupported network')
  }

  return _provider!;
}