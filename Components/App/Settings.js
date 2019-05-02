import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    PixelRatio,
    Image,
    Platform,
    TextInput
} from "react-native";
import {Header,Left,Right,Icon,Content,Grid,Row,Col,Container,H1,H3,Button,Footer} from 'native-base';
import { Switch } from 'react-native-switch';
import LinearGradient from 'react-native-linear-gradient';
import Reset from '../Reset/Reset';

/*
Redux Imports:
*/
import { connect } from "react-redux";
import { updateSettings } from '../../Reducers/settings';
import { updateStopwatch } from '../../Reducers/stopwatch';
import { updateToggleVibrate } from '../../Reducers/toggleVibrate';

console.log('settings 1');

class Settings extends Component {


  state = {
    settings: this.props.settings.settings || '33',
    avgSeconds: this.props.stopwatch.avgSeconds || 0,
    toggleVibrate: this.props.toggleVibrate.toggleVibrate || true,
  };

  handleChange = ( settings, stopwatch, toggleVibrate ) => {
    this.setState({ settings });
    this.setState({ stopwatch });
    this.setState({ toggleVibrate });

  };

    addtoggle = (val) => {
      console.log('addToggle getting hit?');
      console.log(val);
      this.setState({
        toggleVibrate: val,
      }, function () {
        const { toggleVibrate } = this.state
        console.log({ toggleVibrate });
        this.props.dispatch(updateToggleVibrate(this.state.toggleVibrate));
      })
    }

    thresholdInput = () => {
      let threshold = this.props.settings.settings;
      let thresholdNum = Number(this.props.settings.settings);
      let avgSeconds = this.props.stopwatch.avgSeconds
      let avgSecondsNum = Number(this.props.stopwatch.avgSeconds);

      console.log(thresholdNum);
      console.log(avgSecondsNum);

      let thresholdDividedNum = thresholdNum / 100;
      console.log(thresholdDividedNum);
      thresholdDividedNum+=1
      console.log(thresholdDividedNum);

      let thresholdTotalNum = avgSecondsNum * thresholdDividedNum;
      thresholdTotalNum = thresholdTotalNum.toFixed(1);
      console.log(thresholdTotalNum);

      let thresholdTotalString = thresholdTotalNum.toString();

      console.log(thresholdTotalString);


      //let thresholdStr = threshold;
      console.log(threshold + ' threshold');
      //console.log(avgBallSecs + ' avgBallSecs');



      return (
        <Col style={styles.container}>
          <Row style={styles.rowPadding}>
            <H1 style={styles.textHeader}>App settings</H1>
          </Row>
          <Row style={styles.horizontalRule}>
            <Col size={3} style={{marginTop: 20}}>
              <H3 style={{ color: '#fff', justifyContent: 'center', alignContent: 'center', marginTop: 'auto', marginBottom: 'auto', marginLeft: 20}}>Avg. timer threshold:</H3>
            </Col>
            <Col size={1} style={{marginTop: 20}}>
            <TextInput
              style={styles.ThresholdStyle}
              value={threshold}
              maxLength={2}
              keyboardType='numeric'
              onChangeText={(threshold) => this.setState({settings: threshold}, function () {
                const { threshold } = this.state;
                this.props.dispatch(updateSettings( this.state.settings ));
              })
            }
              />
              </Col>
              <Col size={1} style={{marginTop: 20}}>
                <Text style={{fontSize: 40}}>%</Text>
              </Col>
            </Row>
              <Row style={styles.horizontalRule}>
                <Col size={3} style={{marginTop: 20}}>
                  <Row>
                    <H3 style={{color: '#fff', justifyContent: 'center', alignContent: 'center', marginTop: 'auto', marginBottom: 'auto', marginLeft: 20}}>Vibrate reminder:</H3>
                  </Row>
                </Col>
                <Col size={1} style={{marginTop: 20}}>
                  <Text style={{fontSize: 30, height: 45, width: 80, color: '#000' }}>{thresholdTotalNum}</Text>
                </Col>
                <Col size={1} style={{marginTop: 20}}>
                  <Text style={{fontSize: 10, marginTop: 'auto', marginBottom: '20%'}}>seconds</Text>
                </Col>
            </Row>
            <Row style={{borderTopColor: '#fff',
            borderBottomWidth: 0.5,
            width: '100%',
            borderBottomColor: '#fff'
          }}>
              <Text style={{color: '#fff', marginBottom: 10, marginTop: 10, fontSize: 12, marginLeft: 'auto', marginRight: 'auto'}}>(Based on your average seconds per ball of {avgSeconds} seconds)</Text>
            </Row>
            <Row style={{borderTopColor: '#fff',
            borderBottomWidth: 0.5,
            width: '100%',
            borderBottomColor: '#fff'
          }}>
              <Col size={3} style={{marginTop: 20}}>
                <H3 style={{ color: '#fff', justifyContent: 'center', alignContent: 'center', marginTop: 'auto', marginBottom: 'auto', marginLeft: 20}}>Turn off vibrate:</H3>
              </Col>
              <Col size={2} style={{marginTop: 20, marginBottom: 20}}>
                <Switch
                  value={ this.state.toggleVibrate }
                  onValueChange={(val) => this.addtoggle(val)}
                />
              </Col>
            </Row>
            <Row style={styles.rowPadding}>
              <Text style={styles.textHeaderThreshold}>
                Currently the vibrate reminder to alert you when you have forgotten to count a ball is
                <Text style={{fontStyle: 'italic'}}>
                  (Average ball) x ({threshold}%)
                </Text>
              </Text>
            </Row>
            <Row style={styles.rowPadding}>
              <Text style={styles.textHeaderThreshold}>
              Example: {avgSeconds}seconds (average seconds per ball) x {threshold}% (the above set threshold) = {thresholdTotalString}seconds. This means the vibrate function will wait {thresholdTotalString}seconds before reminding you that you have possibly forgotten to count a ball.
              </Text>
            </Row>
            <Row style={styles.rowPadding}>
              <Text style={styles.textHeaderThreshold}>
              Edit the threshold value in the feild above to adjust the % value.
              </Text>
            </Row>
        </Col>

      )
    }

    static navigationOptions = {
      drawerIcon : ({tintColor}) => (
        <Icon name="sync" style={{fontSize: 24, color: tintColor}} />
      )
    }

    render() {
      console.log(this.props.settings.settings);
        return (
            <Container>
              <Header style={styles.headerStyle}>
                <Left size={1}>
                  <Icon name="menu" onPress={() => this.props.navigation.openDrawer()} style={{color: '#fff', paddingLeft: 20, marginTop: 'auto', marginBottom: 'auto' }} />
                </Left>
                <Col size={1} style={ styles.logoStylingCol }>
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
                <Grid>
                    {this.thresholdInput()}
                </Grid>
              </Content>
              <Footer style={{ height: 100, backgroundColor: 'transparent', borderTopWidth: 0, backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 }}>
              <Button rounded large warning style={styles.largeButton}
                  onPress={() => this.props.navigation.navigate('Home')} >
                  <Text style={styles.buttonTextBack}><Icon name='ios-arrow-back' style={styles.buttonTextBack} /> Back to run counter</Text>
                </Button>
                <H1 style={{color:'#fff'}}>
                </H1>
              </Footer>
              </LinearGradient>
            </Container>
        );
    }
}


const mapStateToProps = state => ({
  settings: state.settings,
  stopwatch: state.stopwatch,
  toggleVibrate: state.toggleVibrate,
});


export default connect(mapStateToProps)(Settings);
//export default Settings;

// Custom Styles
const styles = StyleSheet.create({
    container: {
        //flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
    textHeaderThreshold: {
      color: '#fff',
      alignItems: 'flex-start',
      width: '90%'
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
      elevation: 0,
      shadowOpacity: 0,
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
    horizontalRule: {
      borderTopColor: '#fff',
      borderTopWidth: 0.5,
      width: '100%',
      marginTop: 30,
    },
    ThresholdStyle: {
      fontSize: 40,
      width: 60,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderTopColor: '#fff',
      borderBottomColor: '#fff', backgroundColor: 'rgba(204, 204, 204, 0.4)'
    }
});
