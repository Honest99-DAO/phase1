import {
  _evmIncreaseTime,
  assertTxThrows,
  createWallets, delay,
  etherToWei,
  initialDeployment, ONE_DAY,
  THIRTY_DAYS
} from '../utils';
import {assert} from 'chai';
import {formatEther, parseEther} from 'ethers/lib/utils';
import {HonestCasinoFactory, VotingFactory, AccountantFactory} from '../../types/ethers-contracts';
import {BigNumber} from 'ethers';
import {
  AccountantParameter,
  ContractType, NineTokenParameter,
  parseCommonVoting,
  parseUpgradeVoting,
  VoteStatus
} from '../../src/api/voting';


describe('Voting', () => {
  xit('common votings work as expected', async () => {
    const [party1, party2] = await createWallets();
    const {voting, token} = await initialDeployment(party1);
    const votingPar1 = voting.connect(party1);
    const votingPar2 = voting.connect(party2);

    const party1Balance = await token.balanceOf(party1.address);

    await votingPar1.startCommonVoting(ONE_DAY, 'Simple common voting').then(it => it.wait());
    const voting0 = parseCommonVoting(BigNumber.from(0), await votingPar1.getCommonVoting(0));

    assert(voting0.totalAccepted.eq(0), 'There should not be any total accepted vote');
    assert(voting0.totalRejected.eq(0), 'There should not be any total rejected vote');
    assert(!voting0.executed, 'The voting should be in executed state');
    assert(voting0.description == 'Simple common voting', 'The description should be the same');
    console.log(voting0.duration, ONE_DAY);
    assert(voting0.duration == ONE_DAY, 'Voting duration is invalid');

    const rec1 = await votingPar1.vote(0, VoteStatus.ACCEPT).then(it => it.wait());
    // able to revote
    const rec2 = await votingPar1.vote(0, VoteStatus.REJECT).then(it => it.wait());
    const rec3 = await votingPar1.vote(0, VoteStatus.ACCEPT).then(it => it.wait());

    const gasPrice = await party1.provider.getGasPrice();
    const averageGasUsedForVote = (rec1.gasUsed.add(rec2.gasUsed).add(rec3.gasUsed)).mul(gasPrice).div(3);
    console.log(`Average gas used for vote ${formatEther(averageGasUsedForVote)} ETH`);

    await _evmIncreaseTime(ONE_DAY);
    await assertTxThrows(() => votingPar2.vote(0, VoteStatus.ACCEPT), 'Too late to vote');

    await votingPar1.executeVoting(0).then(it => it.wait());
    await assertTxThrows(() => votingPar1.executeVoting(0), 'Voting already executed');

    const voting01 = parseCommonVoting(BigNumber.from(0), await votingPar1.getCommonVoting(0));
    console.log(voting01);

    assert(voting01.totalAccepted.eq(party1Balance), 'There should be ~1999 total accepted vote');
    assert(voting01.totalRejected.eq(0), 'There should not be any total rejected vote');
    assert(voting01.executed, 'The voting should be in executed state');

    await delay(2000);
  });

  xit('upgrade votings work as expected', async () => {
    const [party1, party2, party3, party4, party5, party6, party7, party8, party9, party10] = await createWallets();
    const {token, casino, voting, registry} = await initialDeployment(party1);
    const votingPar1 = voting.connect(party1);
    const votingPar2 = voting.connect(party2);
    const votingPar3 = voting.connect(party3);
    const votingPar4 = voting.connect(party4);
    const votingPar5 = voting.connect(party5);

    await token.mint(party1.address, {value: etherToWei(100)}).then(it => it.wait());
    await token.mint(party2.address, {value: etherToWei(200)}).then(it => it.wait());
    await token.mint(party3.address, {value: etherToWei(100)}).then(it => it.wait());
    await token.mint(party4.address, {value: etherToWei(50)}).then(it => it.wait());
    await token.mint(party5.address, {value: etherToWei(50)}).then(it => it.wait());
    await token.mint(party6.address, {value: etherToWei(50)}).then(it => it.wait());
    await token.mint(party7.address, {value: etherToWei(50)}).then(it => it.wait());
    await token.mint(party8.address, {value: etherToWei(50)}).then(it => it.wait());
    await token.mint(party9.address, {value: etherToWei(50)}).then(it => it.wait());

    const maxSupply = await token.getUintParameter(NineTokenParameter.MAX_TOTAL_SUPPLY);
    const currentSupply = await token.totalSupply();
    const tokensLeftPrice = (maxSupply.sub(currentSupply)).div(10);

    await token.mint(party10.address, {value: tokensLeftPrice}).then(it => it.wait());

    const casinoFactory = new HonestCasinoFactory(party1);
    const upgradedHonestCasino = await casinoFactory.deploy().then(it => it.deployed());
    await upgradedHonestCasino.__initialSetRegistry(registry.address).then(it => it.wait());

    await assertTxThrows(() =>
      votingPar4.startUpgradeVoting(
        ContractType.CASINO,
        THIRTY_DAYS,
        upgradedHonestCasino.address,
        ''
      ),
      'It should be impossible to start a voting without being an executive'
    );

    // voting that should not apply because weight of 1000 < 20% of MAX_MINTED
    await voting.startUpgradeVoting(
      ContractType.CASINO,
      THIRTY_DAYS,
      upgradedHonestCasino.address,
      'We\'re going to fail this guys :c'
    )
      .then(it => it.wait());

    await delay(2000);

    await votingPar3.vote(0, VoteStatus.ACCEPT).then(it => it.wait());

    const voting0 = parseUpgradeVoting(BigNumber.from(0), await votingPar1.getUpgradeVoting(0));
    console.log(voting0);

    await _evmIncreaseTime(THIRTY_DAYS);
    await assertTxThrows(() => votingPar2.vote(0, VoteStatus.ACCEPT), 'Too late to vote');

    await votingPar1.executeVoting(0).then(it => it.wait());

    const newCasino = await registry.getCasino();
    assert(casino.address == newCasino, 'The casino contract should not change');

    // voting that should reject because it's a tie
    await votingPar1.startUpgradeVoting(
      ContractType.CASINO,
      THIRTY_DAYS,
      upgradedHonestCasino.address,
      ''
    ).then(it => it.wait());

    await delay(2000);

    await votingPar2.vote(1, VoteStatus.ACCEPT).then(it => it.wait()); // 2000
    await votingPar3.vote(1, VoteStatus.REJECT).then(it => it.wait()); // 1000
    await votingPar4.vote(1, VoteStatus.REJECT).then(it => it.wait()); // 500
    await votingPar5.vote(1, VoteStatus.REJECT).then(it => it.wait()); // 500

    await _evmIncreaseTime(THIRTY_DAYS);

    await votingPar1.executeVoting(1).then(it => it.wait());

    const voting1 = parseUpgradeVoting(BigNumber.from(1), await voting.getUpgradeVoting(1));
    console.log(voting1);
    assert(voting1.totalAccepted.eq(voting1.totalRejected), 'There should be the same amount of votes for both ACCEPT and REJECT');

    // real voting that should succeed and migrate casino
    await votingPar1.startUpgradeVoting(
      ContractType.CASINO,
      THIRTY_DAYS,
      upgradedHonestCasino.address,
      'This should pass, guys'
    )
      .then(it => it.wait());


    await delay(2000);

    await votingPar1.vote(2, VoteStatus.ACCEPT).then(it => it.wait());
    await votingPar2.vote(2, VoteStatus.ACCEPT).then(it => it.wait());
    await votingPar3.vote(2, VoteStatus.ACCEPT).then(it => it.wait());
    await votingPar4.vote(2, VoteStatus.REJECT).then(it => it.wait());

    await _evmIncreaseTime(THIRTY_DAYS);

    // making some fees for token migration
    for (let i = 0; i < 5; i++) {
      await casino.guess(10, {value: etherToWei(2)}).then(it => it.wait());
    }

    const casinoBalance1 = await casino.provider.getBalance(casino.address);
    const upgradedCasinoBalance1 = await upgradedHonestCasino.provider.getBalance(upgradedHonestCasino.address);

    const rec1 = await votingPar1.executeVoting(2).then(it => it.wait());
    const gasPrice = await party1.provider.getGasPrice();

    const voting2 = parseUpgradeVoting(BigNumber.from(2), await votingPar1.getUpgradeVoting(2));
    console.log(voting2);
    assert(voting2.totalAccepted.gt(voting2.totalRejected), 'There should be more ACCEPT than REJECT votes');

    const casinoBalance2 = await casino.provider.getBalance(casino.address);
    const upgradedCasinoBalance2 = await upgradedHonestCasino.provider.getBalance(upgradedHonestCasino.address);

    console.log(formatEther(casinoBalance1), formatEther(casinoBalance2));
    console.log(formatEther(upgradedCasinoBalance1), formatEther(upgradedCasinoBalance2));
    assert(casinoBalance1.eq(upgradedCasinoBalance2), 'Casino balances should exchange 1');
    assert(casinoBalance2.eq(upgradedCasinoBalance1), 'Casino balances should exchange 2');

    const casinoLink = await registry.getCasino();
    assert(casinoLink == upgradedHonestCasino.address, 'Registry didnt change its casino link');

    const votingFactory = new VotingFactory(party1);
    const upgradedVoting = await votingFactory.deploy().then(it => it.deployed());
    await upgradedVoting.__initialSetRegistry(registry.address).then(it => it.wait());

    // voting that should succeed and migrate voting contract itself
    await votingPar1.startUpgradeVoting(
      ContractType.VOTING,
      THIRTY_DAYS,
      upgradedVoting.address,
      'We are gonna change voting contract itself!'
    )
      .then(it => it.wait());

    await delay(2000);

    await votingPar1.vote(3, VoteStatus.ACCEPT).then(it => it.wait());
    await votingPar2.vote(3, VoteStatus.ACCEPT).then(it => it.wait());

    await _evmIncreaseTime(THIRTY_DAYS);

    const rec2 = await votingPar1.executeVoting(3).then(it => it.wait());

    const voting3 = parseUpgradeVoting(BigNumber.from(3), await votingPar1.getUpgradeVoting(3));
    console.log(voting3);
    assert(voting3.totalAccepted.gt(etherToWei(4000)), 'There should be > 4000 total accepted votes');
    assert(voting3.totalRejected.eq(0), 'There should be 0 total rejected votes');

    const votingLink = await registry.getVoting();
    const registryVotingLink = await upgradedVoting.getRegistry();
    assert(votingLink == upgradedVoting.address, 'Registry didnt updated its voting contract');
    assert(registryVotingLink == registry.address, 'Voting didn\'t updated it\'s registry link');

    // old voting doesn't work now
    await votingPar1.startUpgradeVoting(
      ContractType.CASINO,
      THIRTY_DAYS,
      casino.address,
      'We cant change it from here now, we should move on the new one'
    )
      .then(it => it.wait());

    await delay(2000);

    await votingPar1.vote(4, VoteStatus.ACCEPT).then(it => it.wait());
    await votingPar2.vote(4, VoteStatus.ACCEPT).then(it => it.wait());

    await _evmIncreaseTime(THIRTY_DAYS);

    await assertTxThrows(() => votingPar1.executeVoting(4), 'The old voting should not have access to the registry');

    const upgradedAccountant = await (new AccountantFactory(party1)).deploy().then(it => it.deployed());

    console.log('here 1');

    await upgradedAccountant.__initialSetRegistry(registry.address).then(it => it.wait());


    console.log('here 2');

    // new voting can upgrade an accountant
    await upgradedVoting.startUpgradeVoting(
      ContractType.ACCOUNTANT,
      THIRTY_DAYS,
      upgradedAccountant.address,
      ''
    )
      .then(it => it.wait());


    console.log('here 3');

    const upgVotingPar1 = upgradedVoting.connect(party1);
    const upgVotingPar2 = upgradedVoting.connect(party2);

    await upgVotingPar1.vote(0, VoteStatus.ACCEPT).then(it => it.wait());

    console.log('here 4');

    await upgVotingPar2.vote(0, VoteStatus.ACCEPT).then(it => it.wait());

    console.log('here 5');

    const vt = parseUpgradeVoting(BigNumber.from(0), await upgradedVoting.getUpgradeVoting(0));
    console.log(vt);

    await _evmIncreaseTime(THIRTY_DAYS);

    const rec3 = await upgradedVoting.executeVoting(0).then(it => it.wait());

    console.log('here 6');

    const averageGasUsedExecute = (rec1.gasUsed.add(rec2.gasUsed).add(rec3.gasUsed)).mul(gasPrice).div(3);
    console.log(`Average gas used for execute upgrade voting ${formatEther(averageGasUsedExecute)} ETH`);

    const accountantLink = await registry.getAccountant();
    const registryAccLink = await upgradedAccountant.getRegistry();
    assert(accountantLink == upgradedAccountant.address, 'Registry didn\'t upgraded it\'s accountant link');
    assert(registryAccLink == registry.address, 'Accountant didn\'t upgraded it\'s registry link');

    await delay(2000);
  });

  it('change votings and elections work as expected', async () => {
    const [party1, party2, player] = await createWallets();
    const {token, voting, casino} = await initialDeployment(party1);
    const votingPar1 = voting.connect(party1);

    const maxSupply = await token.getUintParameter(NineTokenParameter.MAX_TOTAL_SUPPLY);
    const currentSupply = await token.totalSupply();
    const tokensLeftPrice = (maxSupply.sub(currentSupply)).div(10);

    await token.mint(party1.address, {value: tokensLeftPrice}).then(it => it.wait());

    await assertTxThrows(() => token.mint(party1.address, {value: 1}), 'It should be impossible to mint more');

    await votingPar1.startUintChangeVoting(
      ContractType.NINE_TOKEN,
      NineTokenParameter.MAX_TOTAL_SUPPLY,
      THIRTY_DAYS,
      etherToWei(20000),
      'Increasing the max total supply'
    ).then(it => it.wait());

    await votingPar1.vote(0, VoteStatus.ACCEPT).then(it => it.wait());
    await _evmIncreaseTime(THIRTY_DAYS);
    const rec1 = await votingPar1.executeVoting(0).then(it => it.wait());

    await token.mint(party1.address, {value: etherToWei(500)}).then(it => it.wait());
    const balance = await token.balanceOf(party1.address);

    assert(balance.eq(BigNumber.from(etherToWei(14999))), 'Party has invalid balance');

    await votingPar1.startUintChangeVoting(
      ContractType.NINE_TOKEN,
      NineTokenParameter.NINE_PER_ETH_MINT_PRICE_PERCENT,
      THIRTY_DAYS,
      2000,
      'Lowering the price of Nines'
    ).then(it => it.wait());

    await votingPar1.vote(1, VoteStatus.ACCEPT).then(it => it.wait());
    await _evmIncreaseTime(THIRTY_DAYS);
    const rec2 = await votingPar1.executeVoting(1).then(it => it.wait());
    const gasPrice = await party1.provider.getGasPrice();

    const averageGasUsedExecute = (rec1.gasUsed.add(rec2.gasUsed)).mul(gasPrice).div(2);
    console.log(`Average gas used for execute uint-change voting ${formatEther(averageGasUsedExecute)} ETH`);

    // buying Nines twice cheaper
    await token.mint(party1.address, {value: etherToWei(250)}).then(it => it.wait());
    const balance1 = await token.balanceOf(party1.address);

    assert(balance1.eq(BigNumber.from(etherToWei(19999))), 'Party has invalid balance');

    await votingPar1.startUintChangeVoting(
      ContractType.ACCOUNTANT,
      AccountantParameter.MAINTENANCE_PERCENT,
      THIRTY_DAYS,
      10,
      'Lowering the maintenance percent'
    ).then(it => it.wait());

    await votingPar1.vote(2, VoteStatus.ACCEPT).then(it => it.wait());
    await _evmIncreaseTime(THIRTY_DAYS);

    const casinoPlayer = casino.connect(player);
    const votingPar2 = votingPar1.connect(party2);
    await token.transfer(party2.address, parseEther('100')).then(it => it.wait());

    const leaderBalance1Before = await party1.provider.getBalance(party1.address);

    for (let i = 0; i < 5; i++) {
      await casinoPlayer.guess(1, {value: parseEther('2.02')}).then(it => it.wait());
    }

    const leaderBalance1After = await party1.provider.getBalance(party1.address);
    const maintenanceFundsBefore = leaderBalance1After.sub(leaderBalance1Before);
    console.log(formatEther(maintenanceFundsBefore));
    assert(maintenanceFundsBefore.eq(parseEther('0.03')), "Invalid maintenance funds before received");

    await votingPar2.executeVoting(2).then(it => it.wait());

    const leaderBalance2Before = await party1.provider.getBalance(party1.address);

    for (let i = 0; i < 5; i++) {
      await casinoPlayer.guess(1, {value: parseEther('2.02')}).then(it => it.wait());
    }

    const leaderBalance2After = await party1.provider.getBalance(party1.address);
    const maintenanceFundsAfter = leaderBalance2After.sub(leaderBalance2Before);
    assert(maintenanceFundsAfter.eq(parseEther('0.01')), "Invalid maintenance funds after received");

    // CHECK LEADER ELECTIONS

    await votingPar2.startLeaderElection(THIRTY_DAYS, party2.address, 'The old one sucks').then(it => it.wait());

    await votingPar1.vote(3, VoteStatus.ACCEPT).then(it => it.wait());
    await votingPar2.vote(3, VoteStatus.ACCEPT).then(it => it.wait());

    await _evmIncreaseTime(THIRTY_DAYS);

    const oldLeader = await token.getLeader();
    console.log(oldLeader);
    assert(oldLeader == party1.address, "Invalid old leader");

    await votingPar2.executeVoting(3).then(it => it.wait());
    const newLeader = await token.getLeader();
    console.log(newLeader);
    assert(newLeader == party2.address, "Invalid new leader");

    await delay(2000);
  });
});
