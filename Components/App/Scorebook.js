import React, {
  Component
} from 'react';
import { StyleSheet, Text, View, Button, PixelRatio, Platform } from 'react-native';

import HeaderDisplay from '../HeaderComponents/HeaderDisplay.js';
import Dot from '../Dot/Dot.js';
import AveragePartnership from '../RunDisplay/AveragePartnership.js';
import CurrentPartnership from '../RunDisplay/CurrentPartnership.js';
import HighestPartnership from '../RunDisplay/HighestPartnership.js';
import TotalDots from '../RunDisplay/TotalDots.js';
import RunsTotal from '../RunDisplay/RunsTotal.js';
import RunPicker from '../RunPicker/RunPicker.js';
import Add from '../Add/Add.js';



import LinearGradient from 'react-native-linear-gradient';
import SplashScreen from 'react-native-splash-screen';

import { Col, Row, Grid } from 'react-native-easy-grid';
import { Container, Header, Footer, Body, Content, Left, Icon } from 'native-base';

// Later on in your styles..
const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
    paddingLeft: 15,
    paddingRight: 15,
    borderRadius: 5
  },
  headerStyle: {
    height: PixelRatio.get() === 1 ? 45 : PixelRatio.get() === 1.5 ? 50 : PixelRatio.get() === 2 ? 80 : PixelRatio.get() === 3.5 ? 60 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 60 : 75,
    backgroundColor: '#12c2e9',
  },
  footerStyle: {
    height: PixelRatio.get() === 1 ? 75 : PixelRatio.get() === 1.5 ? 95 : PixelRatio.get() === 2 ? 100 : PixelRatio.get() === 3.5 ? 120 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 100 : 150,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0
  },
  verticleRule: {
    borderRightColor: '#fff',
    borderRightWidth: 0.5,
    height: '100%',
    marginRight: 10,
    marginLeft: 10,
  },
  horizontalRule: {
    borderBottomColor: '#fff',
    borderBottomWidth: 0.5,
    width: '100%',
    marginTop: 15,
    marginBottom: 15,
  },
});

class Scorebook extends Component {

  componentDidMount() {
    	// do stuff while splash screen is shown
        // After having done stuff (such as async tasks) hide the splash screen
        SplashScreen.hide();
    }

  static navigationOptions = {
    drawerIcon : ({tintColor}) => (
      <Icon name="home" style={{fontSize: 24, color: tintColor}} />
    )
  }

render() {
  return (
      <Container>
        <Header style={styles.headerStyle}>
        <Row>
        <Col size={0.5}>
          <Icon name="menu" onPress={() => this.props.navigation.openDrawer()} style={{color: '#fff', paddingLeft: 20, marginTop: 'auto', marginBottom: 'auto' }}/>
        </Col>
        <HeaderDisplay navigation={this.props.navigation} />
          </Row>
        </Header>
        <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 1}}
        locations={[0,0.9,0.9]} colors={['#12c2e9', '#c471ed']} style={styles.linearGradient}>
          <Content style={{ flex: 1, width: '100%'}}>
          <Row>
          <CurrentPartnership />
          </Row>
            <Row>
            <AveragePartnership />
            <HighestPartnership />
            </Row>
            <Row>
            <TotalDots />
            </Row>
            <Row>
              <RunsTotal />
            </Row>
          </Content>
          <Footer style={styles.footerStyle} noShadow={true} hasTabs={true} >
            <Add />
          </Footer>
        </LinearGradient>
      </Container>
          );
        }
      }


export default Scorebook;
