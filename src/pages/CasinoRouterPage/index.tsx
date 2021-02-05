import {h} from 'preact';
import styles from './index.scss';
import {CasinoHeader} from '~/components/Header';
import {BigNumber} from 'ethers';
import {ITab, Tabs} from '~/components/Tabs';
import {Redirect, Route, Switch} from 'react-router';
import {useDefaultAsyncLazyLoadSelector} from '~/store/utils';
import {casinoActions} from '~/store/casino';
import {CasinoGuessPage} from '~/pages/CasinoGuessPage';
import {CasinoResultPage} from '~/pages/CasinoResultPage';


const tabs: ITab[] = [
  {title: 'Guess', onClickNavTo: '/casino/dashboard/guess'},
  {title: 'Result', onClickNavTo: '/casino/dashboard/result', param: 'simple'}
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
          path='/casino/dashboard/result/:mode'
          render={() => <CasinoResultPage/>}
        />
        <Redirect to='/404'/>
      </Switch>
    </div>
  );
}