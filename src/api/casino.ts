import {HonestCasinoFactory} from '../../types/ethers-contracts';
import {BigNumber, ContractTransaction, Signer} from 'ethers';
import {ICasinoGuessEvent, ICasinoWinEvent} from '~/store/casino';
import {CONFIG} from '~/config';
import {getProvider} from '~/api/utils';


const casino = HonestCasinoFactory.connect(CONFIG.casinoContractAddress, getProvider());

export function getPrizeFund(): Promise<BigNumber> {
  return casino.provider.getBalance(casino.address);
}

export async function getGuessesToday(): Promise<number> {
  const blockNumber = await casino.provider.getBlockNumber();

  const filter = casino.filters.Guess(null, null, null, null);
  // starting from approx. 24 hour ago block
  const events = await casino.queryFilter(filter, blockNumber - 6544, 'latest');

  return events.length;
}

export async function getMyRecentGuess(signer: Signer): Promise<ICasinoGuessEvent | null> {
  const address = await signer.getAddress();
  const filter = casino.filters.Guess(address, null, null, null);
  const events = await casino.queryFilter(filter);

  if (events.length == 0) {
    return null;
  } else {
    const lastEventRaw = events[events.length - 1];

    return {
      number: lastEventRaw.args!['number'].toNumber(),
      nonce: lastEventRaw.args!['nonce'],
      bet: lastEventRaw.args!['bet'],
      blockHash: lastEventRaw.blockHash
    };
  }
}

export async function getMyRecentWin(signer: Signer): Promise<ICasinoWinEvent | null> {
  const address = await signer.getAddress();
  const filter = casino.filters.PrizeClaim(address, null, null);
  const events = await casino.queryFilter(filter);

  if (events.length == 0) {
    return null;
  } else {
    const lastEventRaw = events[events.length - 1];

    return {
      number: lastEventRaw.args!['number'],
      player: lastEventRaw.args!['guesser'],
      prize: lastEventRaw.args!['prizeValue'],
      txnHash: lastEventRaw.transactionHash
    }
  }
}

export async function getRecentWinners(): Promise<ICasinoWinEvent[]> {
  const filter = casino.filters.PrizeClaim(null, null, null);
  const events = await casino.queryFilter(filter);

  const winEvents = events.map(ev => ({
    player: ev.args!['guesser'],
    number: ev.args!['number'],
    prize: ev.args!['prizeValue'],
    txnHash: ev.transactionHash
  }));

  return winEvents.slice(Math.max(winEvents.length - 3, 0));
}

export async function getPrizeMultiplier(): Promise<number> {
  return casino.prizeMultiplier();
}

export interface ICasinoGuessReq {
  bet: BigNumber;
  number: number;
}

export async function makeAGuess(signer: Signer, guess: ICasinoGuessReq): Promise<ContractTransaction> {
  const casinoRW = casino.connect(signer);

  return await casinoRW.guess(guess.number, {value: guess.bet});
}

export async function claimReward(signer: Signer) {
  const casinoRW = casino.connect(signer);
  const address = await signer.getAddress();

  const tx = await casinoRW.claimPrize(address);
  await tx.wait();
}