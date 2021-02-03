import {h} from 'preact';
import styles from './index.scss';
import {CasinoHeader} from '~/components/Header';
import {BigNumber} from 'ethers';
import {ITab, Tabs} from '~/components/Tabs';
import {Redirect, Route, Switch} from 'react-router';
import {DaoVotingsPage} from '~/pages/DaoVotingsPage';
import {useDefaultAsyncLazyLoadSelector} from '~/store/utils';
import {casinoActions} from '~/store/casino';
import {CasinoGuessPage} from '~/pages/CasinoGuessPage';


const tabs: ITab[] = [
  {title: 'Guess', onClickNavTo: '/casino/dashboard/guess'},
  {title: 'Claim prize', onClickNavTo: '/casino/dashboard/claim'}
];

export function CasinoRouterPage() {
  const casinoGuessesToday = useDefaultAsyncLazyLoadSelector(
    state => state.casino.guessesToday,
    casinoActions.getGuessesToday.start()
  );
  const casinoPrizeFund = useDefaultAsyncLazyLoadSelector(
    state => state.casino.prizeFund,
    casinoActions.getPrizeFund.start()
  );

  return (
    <div className={styles.daoRouterPage}>
      <CasinoHeader
        guessesToday={casinoGuessesToday.data || 0}
        prizeFund={casinoPrizeFund.data || BigNumber.from(0)}
      />

      <Tabs className={styles.tabs} tabs={tabs}/>

      <Switch>
        <Route
          path='/casino/dashboard/guess'
          render={() => <CasinoGuessPage/>}
        />
        <Route
          exact
          path='/casino/dashboard/claim'
          render={() => <DaoVotingsPage/>}
        />
        <Redirect to='/404'/>
      </Switch>
    </div>
  );
}