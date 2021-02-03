import {Accountant} from '../../types/ethers-contracts';
import {BigNumber, Signer} from 'ethers';


export interface IPayoutPeriodResetEvent {
  startedAt: number;
  payoutBalanceSnapshot: BigNumber;
  totalJoiSupplySnapshot: BigNumber;
}

export async function getCurrentPayoutPeriod(accountant: Accountant): Promise<IPayoutPeriodResetEvent> {
  const filter = accountant.filters.DividendsDistributionSessionReset(null, null, null);
  const events = await accountant.queryFilter(filter);
  const lastEvent = events[events.length - 1];

  return {
    startedAt: lastEvent.args!['startedAt'].toNumber(),
    payoutBalanceSnapshot: lastEvent.args!['ethBalance'],
    totalJoiSupplySnapshot: lastEvent.args!['joiTotalSupply']
  }
}

export async function resetPayoutPeriod(accountantRO: Accountant, signer: Signer): Promise<void> {
  const accountantRW = accountantRO.connect(signer);

  const tx = await accountantRW.tryResetDividendsDistributionSession();
  await tx.wait();
}

export async function receivePayout(accountantRO: Accountant, signer: Signer): Promise<void> {
  const address = await signer.getAddress();
  const accountantRW = accountantRO.connect(signer);

  const tx = await accountantRW.requestPayout(address);
  await tx.wait();
}