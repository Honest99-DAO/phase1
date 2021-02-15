import {HonestCasino, HonestCasinoFactory} from '../../types/ethers-contracts';
import {BigNumber, ContractTransaction, Signer} from 'ethers';
import {ICasinoGuessReq, ICasinoWinEvent, IGuess} from '~/store/casino';
import {CONFIG, SUPPORTED_NETWORKS} from '~/config';
import {getProvider} from '~/api/utils';
import {Channel, delay} from '~/utils/common';
import {parseGuessFromEvent, parseWinFromEvent} from '~/utils/model';


let _casino: HonestCasino;
export async function reInitCasino(chainId: SUPPORTED_NETWORKS, signer: Signer | null) {
  const BLS = BlockListenerSet;
  const GLS = GuessesListenerSet;
  const PLS = PrizeClaimsListenerSet;

  if (BLS) await teardownBlockListener();
  if (GLS) await teardownGuessesListener();
  if (PLS) await teardownPrizeClaimsListener();

  _casino = HonestCasinoFactory.connect(CONFIG.casinoContractAddress[chainId], signer || getProvider(chainId))

  if (BLS) await setupBlockListener();
  if (GLS) await setupGuessesListener();
  if (PLS) await setupPrizeClaimsListener();
}

async function getCasino(): Promise<HonestCasino> {
  return new Promise(async resolve => {
    while (true) {
      if (_casino) {
        resolve(_casino);
        break;
      }
      await delay(100);
    }
  })
}

// FILTERS

const GuessesTodayFilter = async (guesser?: string) =>
  (await getCasino()).filters.Guess(guesser || null, null, null, null);

const PrizeClaimsFilter = async (guesser?: string) =>
  (await getCasino()).filters.PrizeClaim(guesser || null, null, null, null);

// APIS

export async function getGuessesToday(): Promise<number> {
  const casino = await getCasino();
  const blockNumber = await casino.provider.getBlockNumber();

  // starting from approx. 24 hour ago block
  const events = await casino.queryFilter(await GuessesTodayFilter(), blockNumber - 6544, 'latest');

  return events.length;
}

export async function getMyRecentGuess(signer: Signer): Promise<IGuess | null> {
  const address = await signer.getAddress();
  const casino = await getCasino();
  const events = await casino.queryFilter(await GuessesTodayFilter(address));

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
  const casino = await getCasino();
  const events = await casino.queryFilter(await PrizeClaimsFilter());

  const winEvents = events.map(it => parseWinFromEvent(it as any));

  return winEvents.slice(Math.max(winEvents.length - 3, 0));
}

export async function getMyRecentWin(signer: Signer): Promise<ICasinoWinEvent | null> {
  const address = await signer.getAddress();
  const casino = await getCasino();
  const events = await casino.queryFilter(await PrizeClaimsFilter(address));

  if (events.length == 0) {
    return null;
  } else {
    return parseWinFromEvent(events[events.length - 1] as any);
  }
}

export async function getPrizeFund(): Promise<BigNumber> {
  const casino = await getCasino();
  return casino.provider.getBalance(casino.address);
}

export async function getPrizeMultiplier(): Promise<number> {
  const casino = await getCasino();
  return casino.prizeMultiplier();
}

export async function getCurrentBlockNumber(): Promise<number> {
  const casino = await getCasino();
  return casino.provider.getBlockNumber();
}

export async function makeAGuess(signer: Signer, guess: ICasinoGuessReq): Promise<ContractTransaction> {
  const casino = await getCasino();
  const casinoRW = casino.connect(signer);

  return await casinoRW.guess(guess.number, {value: guess.bet});
}

export async function claimReward(signer: Signer) {
  const casino = await getCasino();
  const casinoRW = casino.connect(signer);
  const address = await signer.getAddress();

  const tx = await casinoRW.claimPrize(address);
  await tx.wait();
}


// LISTENERS

export const GuessesChannel = new Channel<IGuess>();
let GuessesListenerSet = false;
export const setupGuessesListener = async () => {
  if (GuessesListenerSet) return;

  const casino = await getCasino();

  casino.provider.on(await GuessesTodayFilter(), (log) => {
    const parsedLog = casino.interface.parseLog(log);
    GuessesChannel.write(parseGuessFromEvent(parsedLog.args as any, log.blockHash, log.transactionHash, log.blockNumber));
  });
  GuessesListenerSet = true;
}
export const teardownGuessesListener = async () => {
  GuessesListenerSet = false;

  const casino = await getCasino();

  casino.provider.off(await GuessesTodayFilter());
}

export const PrizeClaimsChannel = new Channel<ICasinoWinEvent>();
let PrizeClaimsListenerSet = false;
export const setupPrizeClaimsListener = async () => {
  if (PrizeClaimsListenerSet) return;

  const casino = await getCasino();

  casino.provider.on(await PrizeClaimsFilter(), (log) => {
    const parsedLog = casino.interface.parseLog(log);
    PrizeClaimsChannel.write(parseWinFromEvent(parsedLog.args as any));
  });
  PrizeClaimsListenerSet = true;
}
export const teardownPrizeClaimsListener = async () => {
  PrizeClaimsListenerSet = false;

  const casino = await getCasino();

  casino.provider.off(await PrizeClaimsFilter());
}

export const BlockNumberChannel = new Channel<number>();
export const PrizeMultiplierChannel = new Channel<number>();
export const PrizeFundChannel = new Channel<BigNumber>();
let BlockListenerSet = false;
export const setupBlockListener = async () => {
  if (BlockListenerSet) return;

  const casino = await getCasino();

  casino.provider.on('block', async (blockNumber: number) => {
    const prizeFund = getPrizeFund();
    const prizeMultiplier = getPrizeMultiplier();

    BlockNumberChannel.write(blockNumber);
    PrizeFundChannel.write(await prizeFund);
    PrizeMultiplierChannel.write(await prizeMultiplier);
  });
  BlockListenerSet = true;
}
export const teardownBlockListener = async () => {
  BlockListenerSet = false;

  const casino = await getCasino();

  casino.provider.off('block');
}