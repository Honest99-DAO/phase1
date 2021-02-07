import {BigNumber, ContractReceipt, utils, Event} from 'ethers';
import {ICasinoWinEvent, IGuess} from '~/store/casino';


export function parseGuess(rec: ContractReceipt): IGuess {
  const guessEvent: [string, BigNumber, number, number] = txnReceiptParseEvent(rec);

  return {
    sender: guessEvent[0],
    bet: guessEvent[1],
    number: guessEvent[3],
    randomNumber: calculateRandomNumber(rec.blockHash, guessEvent[2]),
    txnHash: rec.transactionHash,
    blockNumber: rec.blockNumber,
    nonce: guessEvent[2]
  };
}

export function parseGuessFromEvent(
  event: { guesser: string, bet: BigNumber, nonce: number, number: number },
  blockHash: string,
  txnHash: string,
  blockNumber: number
): IGuess {

  return {
    sender: event.guesser,
    bet: event.bet,
    number: event.number,
    randomNumber: calculateRandomNumber(blockHash, event.nonce),
    nonce: event.nonce,
    txnHash,
    blockNumber
  };
}

export function parseWinFromEvent(event: Event & {args: {guesser: string, number: number, prizeValue: BigNumber, nonce: number}}): ICasinoWinEvent {
  return {
    player: event.args.guesser,
    number: event.args.number,
    prize: event.args.prizeValue,
    txnHash: event.transactionHash,
    nonce: event.args.nonce
  }
}

export function txnReceiptParseEvent<T>(rec: ContractReceipt): T {
  // @ts-ignore
  return rec.events[0].args;
}

export function calculateRandomNumber(blockHash: string, nonce: number): number {
  const hashStr = utils.solidityKeccak256(['bytes32', 'uint16'], [blockHash, nonce]);
  const number = BigNumber.from(hashStr);

  return number.mod(100).toNumber();
}

export type WalletId = 'injected' | 'walletconnect';

export function saveWalletId(id: WalletId | null) {
  if (id == null) {
    localStorage.removeItem('__WALLET_ID');
  } else {
    localStorage.setItem('__WALLET_ID', id);
  }
}

export function restoreWalletId(): WalletId | null {
  return localStorage.getItem('__WALLET_ID') as WalletId;
}
