import {providers} from 'ethers';
import {RPCs, SUPPORTED_NETWORKS} from '~/config';


export function getProvider(chainId: SUPPORTED_NETWORKS): providers.Provider {
  return new providers.JsonRpcProvider(RPCs[chainId]);
}