import {AppRegistry} from 'react-native';
//import App from './App0';
import {name as appName} from './app.json';
import React, {Component} from 'react';
import { Provider } from "react-redux";
import { store, persistor } from "./Store/store";
import { PersistGate } from 'redux-persist/integration/react'

import App from './Components/App/App.js';
//import App from './App.js';


class CricketOverCounterApp extends Component {

render() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={null}>
      <App />
      </PersistGate>
    </Provider>
          );
        }
      }

AppRegistry.registerComponent('CricketOverCounterApp', () => CricketOverCounterApp);
