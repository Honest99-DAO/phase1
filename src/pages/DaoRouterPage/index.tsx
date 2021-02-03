import {h} from 'preact';
import styles from './index.scss';
import {DaoHeader} from '~/components/Header';
import {BigNumber} from 'ethers';
import {ITab, Tabs} from '~/components/Tabs';
import {Redirect, Route, Switch, useHistory} from 'react-router';
import {DaoTokenPage} from '~/pages/DaoTokenPage';
import {DaoVotingsPage} from '~/pages/DaoVotingsPage';
import {DaoVotingNewPage} from '~/pages/DaoVotingNewPage';
import {DaoVotingViewPage} from '~/pages/DaoVotingViewPage';
import {useDefaultAsyncLazyLoadSelector, useSigner} from '~/store/utils';
import {joiTokenActions} from '~/store/joiToken';
import {accountantActions} from '~/store/accountant';
import {useDispatch} from 'react-redux';
import {toast} from 'react-toastify';
import {registryActions} from '~/store/registry';
import {THIRTY_DAYS} from '~/utils/common';


const tabs: ITab[] = [
  {title: 'Joi token', onClickNavTo: '/dao/dashboard/token'},
  {title: 'Votings', onClickNavTo: '/dao/dashboard/votings'}
];

export function DaoRouterPage() {
  const dispatch = useDispatch();

  const signer = useSigner();

  const tokenTotalSupply = useDefaultAsyncLazyLoadSelector(
    state => state.joiToken.totalSupply,
    joiTokenActions.getTotalSupply.start()
  );
  const accountantCurrentPayoutPeriod = useDefaultAsyncLazyLoadSelector(
    state => state.accountant.currentPayoutPeriod,
    accountantActions.getCurrentPayoutPeriod.start()
  );

  const tokenUserBalance = useDefaultAsyncLazyLoadSelector(
    state => state.joiToken.myBalanceAt,
    signer && accountantCurrentPayoutPeriod.data
      ? joiTokenActions.getMyBalanceAt.start({signer, timestamp: accountantCurrentPayoutPeriod.data.startedAt})
      : null,
    [JSON.stringify({signer, data: accountantCurrentPayoutPeriod.data})]
  );

  const accountantMyCurrentProfit = useDefaultAsyncLazyLoadSelector(
    state => state.accountant.myCurrentProfit,
    signer ? accountantActions.getMyCurrentProfit.start(signer) : null,
    [JSON.stringify(signer)]
  );

  const currentBlock = useDefaultAsyncLazyLoadSelector(
    state => state.registry.currentBlock,
    registryActions.getCurrentBlock.start()
  );

  const isReset = currentBlock.data && accountantCurrentPayoutPeriod.data
    ? currentBlock.data!.timestamp - THIRTY_DAYS >= accountantCurrentPayoutPeriod.data!.startedAt
    : false;

  const history = useHistory();

  const handleOnReceiveDividendsBtnClick = () => {
    if (!signer) {
      toast.error('Wallet not connected!');
      history.push('/connect-wallet');
      return;
    }

    if (isReset) {
      dispatch(accountantActions.resetPayoutPeriod.start(signer));
    } else {
      dispatch(accountantActions.receivePayout.start(signer));
    }
  };

  return (
    <div className={styles.daoRouterPage}>
      <DaoHeader
        userBalance={tokenUserBalance?.data || BigNumber.from(0)}
        payoutPeriodStaredAt={accountantCurrentPayoutPeriod.data?.startedAt || 0}
        myCurrentProfit={accountantMyCurrentProfit?.data || BigNumber.from(0)}
        totalSupply={tokenTotalSupply.data || BigNumber.from(0)}
        currentBlockTimestamp={currentBlock.data?.timestamp || (new Date()).getTime() / 1000}
        onButtonClick={handleOnReceiveDividendsBtnClick}
        buttonText={isReset ? 'Reset period' : 'Get dividends'}
      />

      <Tabs className={styles.tabs} tabs={tabs}/>

      <Switch>
        <Route
          path='/dao/dashboard/token'
          render={() => <DaoTokenPage/>}
        />
        <Route
          exact
          path='/dao/dashboard/votings'
          render={() => <DaoVotingsPage/>}
        />
        <Route
          path='/dao/dashboard/votings/new'
          render={() => <DaoVotingNewPage/>}
        />
        <Route
          path='/dao/dashboard/votings/view/:type/:id/'
          render={() => <DaoVotingViewPage/>}
        />
        <Redirect to='/404'/>
      </Switch>
    </div>
  );
}