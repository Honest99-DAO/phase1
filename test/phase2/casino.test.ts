import {
  assertTxThrows,
  createWallets,
  delay,
  etherToWei,
  initialDeployment,
  parseGuess,
} from '../utils';
import {assert} from 'chai';
import {formatEther, parseEther} from 'ethers/lib/utils';


xdescribe('Casino', () => {
  it('provides valid casino experience', async () => {
    const [investor0, player1, player2, player3] = await createWallets();
    const {casino, token} = await initialDeployment(investor0);

    const casinoPlayer1 = casino.connect(player1);
    const casinoPlayer2 = casino.connect(player2);
    const casinoPlayer3 = casino.connect(player3);

    const casinoBalance = await casino.provider.getBalance(casino.address);
    await assertTxThrows(
      () => casinoPlayer1.guess(20, {value: casinoBalance.add(etherToWei(1))}),
      'Can not bet more than casino has'
    );

    // transferring some balance to casino
    await token.mint(investor0.address, {value: etherToWei(200)}).then(it => it.wait());

    // players do their plays
    const rec1 = await casinoPlayer1.guess(0, {value: parseEther('1.01')}).then(it => it.wait());
    const rec2 = await casinoPlayer2.guess(20, {value: parseEther('1.01')}).then(it => it.wait());
    const rec3 = await casinoPlayer3.guess(99, {value: parseEther('1.01')}).then(it => it.wait());

    const gasPrice = await player1.provider.getGasPrice();
    const averageGasUsedGuess = (rec1.gasUsed.add(rec2.gasUsed).add(rec3.gasUsed)).mul(gasPrice).div(3);
    console.log(`Average gas used for guess ${formatEther(averageGasUsedGuess)} ETH`);

    const g1 = parseGuess(rec1);
    const g2 = parseGuess(rec2);
    const g3 = parseGuess(rec3);

    assert(g1.number == 0, 'number is not the same 1');
    assert(g2.number == 20, 'number is not the same 2');
    assert(g3.number == 99, 'number is not the same 3');
    assert(g1.bet.eq(etherToWei(1)), 'bet is not the same 1');
    assert(g2.bet.eq(etherToWei(1)), 'bet is not the same 2');
    assert(g3.bet.eq(etherToWei(1)), 'bet is not the same 3');
    assert(g1.sender == player1.address, 'sender is not the same 1');
    assert(g2.sender == player2.address, 'sender is not the same 2');
    assert(g3.sender == player3.address, 'sender is not the same 3');

    // checking constraints
    await assertTxThrows(
      () => casinoPlayer1.guess(-1, {value: 100}),
      'Should throw on negative numbers'
    );
    await assertTxThrows(
      () => casinoPlayer1.guess(100, {value: 100}),
      'Should throw on > 99'
    );
    await assertTxThrows(
      () => casinoPlayer1.guess(20, {value: parseEther('2.1')}),
      'Should throw on bet more than 2 eth'
    );

    // checking if this is possible to win
    let stop = false;
    let i = 0;
    while (!stop) {
      i++;

      const p1 = casinoPlayer1.guess(0, {value: parseEther('1.01')}).then(it => it.wait());
      const p2 = casinoPlayer2.guess(20, {value: parseEther('1.01')}).then(it => it.wait());
      const p3 = casinoPlayer3.guess(99, {value: parseEther('1.01')}).then(it => it.wait());

      const [rec1, rec2, rec3] = await Promise.all([p1, p2, p3]);

      const gs = [parseGuess(rec1), parseGuess(rec2), parseGuess(rec3)];
      const win = gs.find(it => it.number == it.randomNumber);

      if (win) {
        console.log(`We have a winner since ${i*3} trials!`, `random: ${win.randomNumber}`, `guess: ${win.number}`);

        const balanceBefore = await casinoPlayer1.provider.getBalance(win.sender);
        await casinoPlayer1.claimPrize(win.sender).then(it => it.wait());
        const balanceAfter = await casinoPlayer1.provider.getBalance(win.sender);

        const prizeValue = balanceAfter.sub(balanceBefore);
        console.log(formatEther(prizeValue));
        assert(prizeValue.eq(parseEther('99')), 'Invalid prize value');

        break;
      }
    }

    await delay(2000);
  });
});

