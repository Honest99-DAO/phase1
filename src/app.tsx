import 'regenerator-runtime/runtime';
import {h, render} from 'preact';
import {Provider} from 'react-redux';
import './utils/reset.scss';
import 'react-toastify/dist/ReactToastify.css';
import {store} from './store';
import {ToastContainer} from 'react-toastify';
import { UseWalletProvider } from 'use-wallet';
import {Routes} from '~/routes';
import {CONFIG} from '~/config';


const App = () => {
  return (
    <UseWalletProvider chainId={CONFIG.chainId}>
      <Provider store={store}>
        <Routes/>
        <ToastContainer/>
      </Provider>
    </UseWalletProvider>
  );
};


const rootElem = document.getElementById('root')!;

render(<App/>, rootElem);