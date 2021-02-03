import {HonestCasino} from '../../types/ethers-contracts';
import {BigNumber, Signer} from 'ethers';
import {ICasinoGuessEvent, ICasinoWinEvent} from '~/store/casino';


export function getPrizeFund(casino: HonestCasino): Promise<BigNumber> {
  return casino.provider.getBalance(casino.address);
}

export async function getGuessesToday(casino: HonestCasino): Promise<number> {
  const blockNumber = await casino.provider.getBlockNumber();

  const filter = casino.filters.Guess(null, null, null, null);
  // starting from approx. 24 hour ago block
  const events = await casino.queryFilter(filter, blockNumber - 6544, 'latest');

  return events.length;
}

export async function getMyRecentGuess(casino: HonestCasino, signer: Signer): Promise<ICasinoGuessEvent | null> {
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

export async function getMyRecentWin(casino: HonestCasino, signer: Signer): Promise<ICasinoWinEvent | null> {
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
      blockHash: lastEventRaw.blockHash
    }
  }
}

export async function getRecentWinners(casino: HonestCasino): Promise<ICasinoWinEvent[]> {
  const filter = casino.filters.PrizeClaim(null, null, null);
  const events = await casino.queryFilter(filter);

  const winEvents: ICasinoWinEvent[] = events.map(ev => ({
    player: ev.args!['guesser'],
    number: ev.args!['number'].toNumber(),
    prize: ev.args!['prizeValue'],
    blockHash: ev.blockHash
  }));

  return winEvents;
}

export interface ICasinoGuessReq {
  bet: BigNumber;
  number: number;
}

export async function makeAGuess(casinoRO: HonestCasino, signer: Signer, guess: ICasinoGuessReq) {
  const casinoRW = casinoRO.connect(signer);

  const tx = await casinoRW.guess(guess.number, {value: guess.bet});
  await tx.wait();
}

export async function claimReward(casinoRO: HonestCasino, signer: Signer) {
  const casinoRW = casinoRO.connect(signer);
  const address = await signer.getAddress();

  const tx = await casinoRW.claimPrize(address);
  await tx.wait();
}