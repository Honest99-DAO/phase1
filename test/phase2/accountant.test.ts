import {
  _evmIncreaseTime,
  assertTxThrows,
  createWallets, delay,
  initialDeployment, THIRTY_DAYS
} from '../utils';
import {assert} from 'chai';
import {formatEther, parseEther} from 'ethers/lib/utils';
import {BigNumber} from 'ethers';
import {AccountantParameter} from '../../src/api/voting';


xdescribe('Accountant', () => {
  it('provides valid investment experience', async () => {
    const [investor0, player1, investor1, investor2] = await createWallets();
    const {casino, token, accountant} = await initialDeployment(investor0);
    const casinoPlayer1 = casino.connect(player1);

    const totalSupply = await token.totalSupply();
    console.log(formatEther(totalSupply));

    // mint to 3000
    await token.mint(investor0.address, {value: parseEther('99.92')}).then(it => it.wait());

    const bal = await token.balanceOf(investor0.address);
    console.log(formatEther(bal));

    await assertTxThrows(() => accountant.requestPayout(investor0.address), 'Unable to payout right after deployment (need wait 30 days)');
    await assertTxThrows(() => token.mint(investor1.address), 'Unable to mint without investing');

    // mint the rest
    await token.mint(investor1.address, {value: parseEther('350')}).then(it => it.wait());
    await token.mint(investor2.address, {value: parseEther('350')}).then(it => it.wait());

    const totalSupply1 = await token.totalSupply();
    assert(totalSupply1.eq(parseEther('9999')), "Insufficient total supply");

    const investor0Balance = await token.balanceOf(investor0.address);
    const investor1Balance = await token.balanceOf(investor1.address);
    const investor2Balance = await token.balanceOf(investor2.address);

    assert(investor0Balance.eq(parseEther('2999')), 'Investor 0 should ~2998 Nines');
    assert(investor1Balance.eq(parseEther('3500')), 'Investor 1 should have 3500 Nines');
    assert(investor2Balance.eq(parseEther('3500')), 'Investor 2 should have 3500 Nines');

    const payoutBalance0 = await accountant.provider.getBalance(accountant.address);
    assert(payoutBalance0.eq(parseEther('0')), 'There should be 0 eth at accountant contract');

    // add 1 ETH fee
    for (let i = 0; i < 30; i++) {
      await casinoPlayer1.guess(10, {value: parseEther('2.02')}).then(it => it.wait());
    }

    const maintenancePercent = await accountant.getUintParameter(AccountantParameter.MAINTENANCE_PERCENT);
    const payoutBalance1 = await accountant.provider.getBalance(accountant.address);

    assert(payoutBalance1.eq(parseEther('0.6').mul(BigNumber.from(100).sub(maintenancePercent)).div(100)), 'Payout balance should be 0.28 Eth');

    // make a payout
    const investor0Balance0 = await investor0.getBalance();
    const investor1Balance0 = await investor1.getBalance();
    const investor2Balance0 = await investor2.getBalance();

    await assertTxThrows(() => accountant.requestPayout(investor0.address), 'Payout is not ready yet');

    await _evmIncreaseTime(THIRTY_DAYS);

    const gasPrice = await investor1.provider.getGasPrice();

    const rec0 = await accountant.tryResetDividendsDistributionSession().then(it => it.wait());
    console.log(`Gas used for reset dividends distribution session ${formatEther(rec0.gasUsed.mul(gasPrice))} ETH`);

    const rec1 = await accountant.receiveDividends(investor0.address).then(it => it.wait());
    const rec2 = await accountant.receiveDividends(investor1.address).then(it => it.wait());
    const rec3 = await accountant.receiveDividends(investor2.address).then(it => it.wait());

    const averageGasUsedExecute = (rec1.gasUsed.add(rec2.gasUsed).add(rec3.gasUsed)).mul(gasPrice).div(3);
    console.log(`Average gas used for receive dividends ${formatEther(averageGasUsedExecute)} ETH`);

    await assertTxThrows(() => accountant.receiveDividends(investor0.address), 'Investor 0 already received a payout');

    const investor0Balance1 = await investor0.getBalance();
    const investor1Balance1 = await investor1.getBalance();
    const investor2Balance1 = await investor2.getBalance();

    assert(investor0Balance0.lt(investor0Balance1), 'Investor 0 should receive dividends');
    assert(investor1Balance0.lt(investor1Balance1), 'Investor 1 should receive dividends');
    assert(investor2Balance0.lt(investor2Balance1), 'Investor 2 should receive dividends');

    assert(investor1Balance1.eq(investor1Balance1), 'Investors 1 and 2 should make the same dividends');
    assert(investor0Balance1.lt(investor1Balance1), 'Investor 0 should make less money than investor 1');

    // add another 1 ETH fee
    for (let i = 0; i < 30; i++) {
      await casinoPlayer1.guess(10, {value: parseEther('2.02')}).then(it => it.wait());
    }

    // investor 1 lost all their Nines (they should not be able to receive fees anymore)
    const tokenInv1 = token.connect(investor1);
    await tokenInv1.transfer(investor2.address, parseEther('3500')).then(it => it.wait());

    // make a payout again
    await _evmIncreaseTime(THIRTY_DAYS);
    await accountant.tryResetDividendsDistributionSession().then(it => it.wait());

    await accountant.receiveDividends(investor0.address).then(it => it.wait());
    await accountant.receiveDividends(investor1.address).then(it => it.wait());
    await accountant.receiveDividends(investor2.address).then(it => it.wait());

    const investor0Balance2 = await investor0.getBalance();
    const investor1Balance2 = await investor1.getBalance();
    const investor2Balance2 = await investor2.getBalance();

    assert(investor0Balance1.lt(investor0Balance2), 'Investor 0 should receive dividends');
    assert(investor2Balance1.lt(investor2Balance2), 'Investor 2 should receive dividends');
    assert(investor1Balance1.gt(investor1Balance2), 'Investor 1 should receive nothing');

    // add 1 ETH fee again
    for (let i = 0; i < 30; i++) {
      await casinoPlayer1.guess(10, {value: parseEther('2.02')}).then(it => it.wait());
    }

    // investor1 receives 2999 Nines - investor0 and investor1 have equal shares (should receive equal profit)
    const tokenInv2 = token.connect(investor2);
    await tokenInv2.transfer(investor1.address, parseEther('2999')).then(it => it.wait());

    const investor0Balance3 = await investor0.getBalance();
    const investor1Balance3 = await investor1.getBalance();
    const investor2Balance3 = await investor2.getBalance();

    // make a payout again
    await _evmIncreaseTime(THIRTY_DAYS);
    const accInv2 = accountant.connect(investor2);
    await accInv2.tryResetDividendsDistributionSession().then(it => it.wait());

    await accInv2.receiveDividends(investor0.address).then(it => it.wait());
    await accInv2.receiveDividends(investor1.address).then(it => it.wait());
    await accInv2.receiveDividends(investor2.address).then(it => it.wait());

    const investor0Balance4 = await investor0.getBalance();
    const investor1Balance4 = await investor1.getBalance();
    const investor2Balance4 = await investor2.getBalance();

    const inv0Profit = investor0Balance4.sub(investor0Balance3);
    const inv1Profit = investor1Balance4.sub(investor1Balance3);
    const inv2Profit = investor2Balance4.sub(investor2Balance3);

    console.log(formatEther(investor0Balance4), formatEther(investor0Balance3), formatEther(inv0Profit));
    console.log(formatEther(investor1Balance4), formatEther(investor1Balance3), formatEther(inv1Profit));
    console.log(formatEther(investor2Balance4), formatEther(investor2Balance3), formatEther(inv2Profit));

    assert(
      inv0Profit.eq(inv1Profit),
      'Investors 0 & 1 should receive equal profit'
    );
    assert(inv2Profit.gt(inv0Profit), 'Investor 2 should receive some profit more than others');

    await delay(2000);
  });
});
