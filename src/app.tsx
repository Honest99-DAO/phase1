import 'regenerator-runtime/runtime';
import {h, render} from 'preact';
import {Provider} from 'react-redux';
import './utils/reset.scss';
import 'react-toastify/dist/ReactToastify.css';
import {store} from './store';
import {ToastContainer} from 'react-toastify';
import {Routes} from '~/routes';
import {Web3ReactProvider} from '@web3-react/core';
import {providers} from 'ethers';


function getLibrary(provider: providers.ExternalProvider) {
  return (new providers.Web3Provider(provider)).getSigner(0);
}

const App = () => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Provider store={store}>
        <Routes/>
        <ToastContainer/>
      </Provider>
    </Web3ReactProvider>
  );
};


const rootElem = document.getElementById('root')!;

render(<App/>, rootElem);