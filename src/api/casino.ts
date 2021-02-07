import {HonestCasinoFactory} from '../../types/ethers-contracts';
import {BigNumber, ContractTransaction, Signer, Event} from 'ethers';
import {ICasinoGuessReq, ICasinoWinEvent, IGuess} from '~/store/casino';
import {CONFIG} from '~/config';
import {getProvider} from '~/api/utils';
import {Channel} from '~/utils/common';
import {parseGuessFromEvent, parseWinFromEvent} from '~/utils/model';


const casino = HonestCasinoFactory.connect(CONFIG.casinoContractAddress, getProvider());

// FILTERS

const GuessesTodayFilter = (guesser?: string) => casino.filters.Guess(guesser || null, null, null, null);
const PrizeClaimsFilter = (guesser?: string) => casino.filters.PrizeClaim(guesser || null, null, null, null);

// APIS

export async function getGuessesToday(): Promise<number> {
  const blockNumber = await casino.provider.getBlockNumber();

  // starting from approx. 24 hour ago block
  const events = await casino.queryFilter(GuessesTodayFilter(), blockNumber - 6544, 'latest');

  return events.length;
}

export async function getMyRecentGuess(signer: Signer): Promise<IGuess | null> {
  const address = await signer.getAddress();
  const events = await casino.queryFilter(GuessesTodayFilter(address));

  if (events.length == 0) {
    return null;
  } else {
    const lastEventRaw = events[events.length - 1];

    return parseGuessFromEvent(
      lastEventRaw.args as any,
      lastEventRaw.blockHash,
      lastEventRaw.transactionHash,
      lastEventRaw.blockNumber
    )
  }
}

export async function getRecentWinners(): Promise<ICasinoWinEvent[]> {
  const events = await casino.queryFilter(PrizeClaimsFilter());

  const winEvents = events.map(it => parseWinFromEvent(it as any));

  return winEvents.slice(Math.max(winEvents.length - 3, 0));
}

export async function getMyRecentWin(signer: Signer): Promise<ICasinoWinEvent | null> {
  const address = await signer.getAddress();
  const events = await casino.queryFilter(PrizeClaimsFilter(address));

  if (events.length == 0) {
    return null;
  } else {
    return parseWinFromEvent(events[events.length - 1] as any);
  }
}

export function getPrizeFund(): Promise<BigNumber> {
  return casino.provider.getBalance(casino.address);
}

export async function getPrizeMultiplier(): Promise<number> {
  return casino.prizeMultiplier();
}

export async function getCurrentBlockNumber(): Promise<number> {
  return casino.provider.getBlockNumber();
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


// LISTENERS

export const GuessesChannel = new Channel<IGuess>();
let GuessesListenerSet = false;
export const setupGuessesListener = () => {
  if (GuessesListenerSet) return;

  casino.provider.on(GuessesTodayFilter(), (_, event: Event) => {
    console.log('New guess event', event);
    GuessesChannel.write(parseGuessFromEvent(event.args as any, event.blockHash, event.transactionHash, event.blockNumber));
  });
  GuessesListenerSet = true;
}

export const PrizeClaimsChannel = new Channel<ICasinoWinEvent>();
let PrizeClaimsListenerSet = false;
export const setupPrizeClaimsListener = () => {
  if (PrizeClaimsListenerSet) return;

  casino.provider.on(PrizeClaimsFilter(), (_, event: Event) => {
    console.log('New prize claim event', event);
    PrizeClaimsChannel.write(parseWinFromEvent(event as any));
  });
  PrizeClaimsListenerSet = true;
}

export const BlockNumberChannel = new Channel<number>();
export const PrizeMultiplierChannel = new Channel<number>();
export const PrizeFundChannel = new Channel<BigNumber>();
casino.provider.on('block', async (blockNumber: number) => {
  const prizeFund = getPrizeFund();
  const prizeMultiplier = getPrizeMultiplier();

  BlockNumberChannel.write(blockNumber);
  PrizeFundChannel.write(await prizeFund);
  PrizeMultiplierChannel.write(await prizeMultiplier);
});