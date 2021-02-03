import {getProvider} from './utils';
import {
  Accountant, AccountantFactory,
  HonestCasino,
  HonestCasinoFactory,
  JoiToken,
  JoiTokenFactory,
  RegistryFactory, Voting, VotingFactory
} from '../../types/ethers-contracts';
import {CONFIG} from '~/config';

const registry = RegistryFactory.connect(CONFIG.registryContractAddress, getProvider());

export async function getCasino(): Promise<HonestCasino> {
  const casinoAddress = await registry.getCasino();

  return HonestCasinoFactory.connect(casinoAddress, getProvider())
}

export async function getJoiToken(): Promise<JoiToken> {
  const tokenAddress = await registry.getJoiToken();

  return JoiTokenFactory.connect(tokenAddress, getProvider());
}

export async function getVoting(): Promise<Voting> {
  const votingAddress = await registry.getVoting();

  return VotingFactory.connect(votingAddress, getProvider());
}

export async function getAccountant(): Promise<Accountant> {
  const accountantAddress = await registry.getAccountant();

  return AccountantFactory.connect(accountantAddress, getProvider());
}

export async function getBlock(blockId: string | number = 'latest') {
  return registry.provider.getBlock(blockId);
}