import React, {
  Component
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
//import { LinearGradient } from 'expo';
//import Button from '../Button/Button.js';
//import Display from '../Display/Display.js';
import Add from '../Add/Add.js';
import Overs from '../Overs/Overs.js';
import Wickets from '../Wickets/Wickets.js';
import Stats from '../Stats/Stats.js';
import HeaderDisplay from '../HeaderComponents/HeaderDisplay.js';
//import Purchase from '../inAppPurchase/inAppPurchase.js';

import { Col, Row, Grid } from 'react-native-easy-grid';
import { Container, Header, Footer, Body, Content } from 'native-base';

import BallCalc from '../../Util/BallCalc.js';
import BallDiff from '../../Util/BallDiff.js';

// Later on in your styles..
const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 15,
    borderRadius: 5
  },
});

class App extends Component {

render() {
  return (
      <Container>
        <Header style={{height: 75, backgroundColor: '#12c2e9'}}>
          <HeaderDisplay />
        </Header>
        <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 1}}
        locations={[0,0.9,0.9]} colors={['#12c2e9', '#c471ed']} style={styles.linearGradient}>
          <Content style={{ flex: 1, width: '100%'}}>
            <Stats />
            <Wickets className="Wicket" />
            <Overs />
          </Content>
          <Footer style={{ height: 100, backgroundColor: 'transparent', borderTopWidth: 0 }}>
            <Add />
          </Footer>
        </LinearGradient>
      </Container>
          );
        }
      }


export default App;
