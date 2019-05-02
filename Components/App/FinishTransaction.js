import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    Platform,
    PixelRatio,
    Image,
} from "react-native";
import {Header,Left,Right,Icon,Content,Grid,Row,Col,Container,H1,Button,Footer} from 'native-base';
import LinearGradient from 'react-native-linear-gradient';

//Redux imports
import { connect } from "react-redux";
import { updateToggle } from '../../Reducers/toggle';

//In-app Purchase import
import * as RNIap from 'react-native-iap';



class FinishTransaction extends Component {
    constructor(props) {
   super(props);
   this.state = {
     searchViewVisible: false,
   };
 }

 state = {
   toggle: this.props.toggle.toggle || '',
 };

 handleChange = toggle => {
   this.setState({ toggle });
 };


 async componentDidMount() {
   const toggleValue = true;
   this.setState({
     toggle: toggleValue,
   }, function () {
     const { toggle } = this.state
     //this.props.addToggle({ toggle });
     this.props.dispatch(updateToggle(this.state.toggle));
   })
 }

 handleBack = () => {
   this.props.navigation.goBack();
   console.log('handleBack');
 };

 onNaverLogout = () => {
   this.props.navigation.goBack();
   console.log('onNaverLogout');
 };

 renderFinishTransaction() {
   if (Platform.OS === 'android') return null;
   return (
     <Button
       onPress={() => RNIap.finishTransaction()}
       activeOpacity={0.5}
       style={styles.btn}
       textStyle={styles.txt}
     ><Text>Finish Transaction (iOS)</Text></Button>
   );
 };

    render() {
        return (
            <Container>
              <Header style={styles.headerStyle}>
                <Left size={1}>
                  <Icon name="menu" onPress={() => this.props.navigation.openDrawer()} style={{color: '#fff', paddingLeft: 20, marginTop: 'auto', marginBottom: 'auto' }} />
                </Left>
                <Col size={2} style={ styles.logoStylingCol }>
                <Image
                 source={require('../../assets/4dot6logo-transparent.png')}
                 style={{ height: '100%', width: 'auto', justifyContent: 'center', alignItems: 'center', resizeMode: 'contain' }}
                />
                </Col>
                <Right size={1} style={styles.colVerticleAlign}>
                  </Right>
              </Header>
              <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 1}}
              locations={[0,0.9,0.9]} colors={['#12c2e9', '#c471ed']} style={styles.linearGradient}>
              <Content style={{ flex: 1, width: '100%'}}>
                <Grid style={{backgroundColor: '#fff', borderRadius: 20, padding: 30, alignItems: 'center', marginTop: 20}}>
                  <Col>
                    <Row>
                      <H1 style={styles.colCenter}>Purcahse succesfull</H1>
                  </Row>
                  <Row>
                    <Text style={styles.colCenterPadding}>You can now get all features for the entire innings. Enjoy!</Text>
                  </Row>
                  <Row>
                  <Button rounded large warning style={styles.largeButton}
                      onPress={() => this.props.navigation.navigate('Home')} >
                      <Text style={styles.buttonTextBack}><Icon name='ios-arrow-back' style={styles.buttonTextBack} /> Back to run counter</Text>
                    </Button>
                    </Row>
                  </Col>
                </Grid>
              </Content>
              <Footer style={{ height: 100, backgroundColor: 'transparent', borderTopWidth: 0, backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 }}>
              <Button rounded large warning style={styles.largeButton}
                  onPress={() => this.props.navigation.navigate('Home')} >
                  <Text style={styles.buttonTextBack}><Icon name='ios-arrow-back' style={styles.buttonTextBack} /> Back to run counter</Text>
                </Button>
              </Footer>
              </LinearGradient>
            </Container>
        );
    }
}

const mapStateToProps = state => ({
  toggle: state.toggle,
});

export default connect(mapStateToProps)(FinishTransaction);

// Custom Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    linearGradient: {
      flex: 1,
      paddingLeft: 15,
      paddingRight: 15,
      borderRadius: 5
    },
    textHeader: {
      color: '#fff',
      alignItems: 'center',
      justifyContent: 'center'
    },
    textDesc: {
      color: '#eee',
      fontWeight: '100',
    },
    textHeaderNumber: {
      color: '#fff',
      fontSize: 40,
      lineHeight: 40,
    },
    colCenter: {
      alignItems: 'center',
    },
    colCenterPadding: {
      alignItems: 'center',
      paddingBottom: 20,
    },
    horizontalRule: {
      borderBottomColor: '#fff',
      borderBottomWidth: 0.5,
      width: '100%',
      marginTop: 15,
      marginBottom: 15,
    },
    colVerticleAlign: {
      marginTop: 'auto',
      marginBottom: 'auto',
    },
    largeButton: {
      width: '100%',
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      fontSize: PixelRatio.get() === 1 ? 28 : PixelRatio.get() === 1.5 ? 32 : PixelRatio.get() === 2 ? 36 : 40,
      color: '#c471ed',
      marginTop: 'auto',
      marginRight: 'auto',
      marginBottom: 'auto',
      marginLeft: 'auto',
      fontWeight: '200',
    },
    buttonTextBack: {
      fontSize: 20,
      color: '#c471ed',
      marginTop: 'auto',
      marginRight: 'auto',
      marginBottom: 'auto',
      marginLeft: 'auto',
      fontWeight: '200',
    },
    rowPadding :{
      paddingTop: 20,
    },
    btn: {
    height: 50,
    width: 240,
    alignSelf: 'center',
    backgroundColor: '#00c40f',
    borderRadius: 0,
    borderWidth: 0,
  },
  txt: {
    fontSize: 12,
    color: 'white',
  },
  logoStylingCol :{
    marginBottom: 5,
    marginTop: 5,
    marginLeft: Platform.OS === 'android' ? '17%' : 0,
    justifyContent: 'center'
  },
  headerStyle: {
    height: PixelRatio.get() === 1 ? 45 : PixelRatio.get() === 1.5 ? 50 : PixelRatio.get() === 2 ? 75 : PixelRatio.get() === 3.5 ? 60 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 60 : 75,
    backgroundColor: '#12c2e9',
  },
});

/*
<Container>
  <Header style={{height: 75, backgroundColor: '#12c2e9'}}>
    <Left size={1}>
      <Icon name="menu" onPress={() => this.props.navigation.openDrawer()} style={{color: '#fff', paddingLeft: 20, marginTop: 'auto', marginBottom: 'auto' }} />
    </Left>
    <Col size={1}>
      <Text style={{textAlign: 'center', marginTop: 'auto', marginBottom: 'auto', color: '#fff'}}>4DOT6</Text>
    </Col>
    <Right size={1} style={styles.colVerticleAlign}>
      </Right>
  </Header>
  <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 1}}
  locations={[0,0.9,0.9]} colors={['#12c2e9', '#c471ed']} style={styles.linearGradient}>
    <Content style={{ flex: 1, width: '100%'}}>
      <Grid style={{backgroundColor: '#fff', borderRadius: 20, padding: 30, alignItems: 'center', marginTop: 20}}>
        <ScrollView style={{ alignSelf: 'stretch' }}>
        <Text>Hello!</Text>
        {this.renderFinishTransaction()}
          <Button
            onPress={this.onNaverLogout}
            activeOpacity={0.5}
            style={styles.btnNaverLogin}
            textStyle={styles.txtNaverLogin}
          >
            <Text>LOGOUT</Text>
          </Button>
        </ScrollView>
      </Grid>
    </Content>
  <Footer style={{ height: 100, backgroundColor: 'transparent', borderTopWidth: 0 }}>
  <Button rounded large warning style={styles.largeButton}
      onPress={() => this.props.navigation.navigate('Home')} >
      <Text style={styles.buttonTextBack}><Icon name='ios-arrow-back' style={styles.buttonTextBack} /> Back to over counter</Text>
    </Button>
  </Footer>
  </LinearGradient>
</Container>

*/

/*
<Text style={styles.txtResult}>
  {this.props.navigation.state.params.receipt}
</Text>
*/

/*
marginTop: Platform.OS === 'ios' ? 0 : '$statusSize',
paddingTop: Platform.OS === 'ios' ? '$statusPaddingSize' : 0,
*/
