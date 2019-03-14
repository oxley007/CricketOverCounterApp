/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, SafeAreaView, ScrollView, Dimensions, Image} from 'react-native';
import {
      createStackNavigator,
      createAppContainer,
      createDrawerNavigator,
      DrawerItems
    } from 'react-navigation';
//import LoginScreen from './Components/App/LoginScreen.js';
import AppHome from './Components/App/HomeApp.js';
import ResetHome from './Components/App/ResetHome.js';
import FeedbackHome from './Components/App/FeedbackHome.js';
import ProHome from './Components/App/ProHome.js';
import FinishTransaction from './Components/App/FinishTransaction.js';
import Settings from './Components/App/Settings.js';
//import HeaderDisplay from './Components/HeaderComponents/HeaderDisplay.js';
import {Header,Left,Right,Icon} from 'native-base';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

/*
const { width } = Dimensions.get('window');
*/

class Hidden extends React.Component {
  render() {
    return null;
  }
}

const CustomDrawerComponent = (props) => (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#12c2e9' }}>
    <View style={{ height: 150, alignItems: 'center', justifyContent: 'center' }}>
      <Image source={require('./assets/4dot6-logo-500px.png')} style={{height: 120, width: 120, borderRadius: 60, borderColor: '#fff', borderWidth:4}} />
    </View>
    <ScrollView>
      <DrawerItems {...props} />
    </ScrollView>
  </SafeAreaView>
  );

const RootStack = createDrawerNavigator(
  {
    Home: {
      screen: AppHome,
    },
    Reset: {
      screen: ResetHome,
    },
    Feedback: {
      screen: FeedbackHome,
    },
    Upgrade: {
      screen: ProHome,
    },
    Settings: {
      screen: Settings,
    },
    Logout: {
      screen: FinishTransaction,
      navigationOptions: {
      drawerLabel: <Hidden />
    }
    },
  },
  {
    contentComponent: CustomDrawerComponent,
    //drawerWidth: width,
    contentOptions: {
      activeTintColor: '#fff'
    }
  }
);


  const App = createAppContainer(RootStack);

  export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#12c2e9',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#fff',
    marginBottom: 5,
  },
});
