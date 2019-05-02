import React, { Component } from 'react';

/*
Native base and react native
*/
import { Container, Footer, H2, H1, Text, Icon, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, Vibration, PixelRatio, Dimensions, Platform } from 'react-native';

/*
vibrate import
*/
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

/*
Redux Imports*/
import { connect } from "react-redux";
import { updateStopwatch } from '../../Reducers/stopwatch';
import { updateSettings } from '../../Reducers/settings';
import { updateToggle } from '../../Reducers/toggle';
import { updateOver } from '../../Reducers/over';
import { updateToggleVibrate } from '../../Reducers/toggleVibrate';
//import { updateSettings } from '../../Reducers/settings';

/*
animation prackage
*/
import * as Animatable from 'react-native-animatable';

/*
Import pixel ratio module
*/
import { normalize, normalizeFont } from '../../Util/PixelRatio.js';


const formattedSeconds = (sec) =>
  Math.floor(sec / 60) +
    ':' +
  ('0' + sec % 60).slice(-2)

  //Constants for vibration.
  //const DURATION = 500 ;
  //const PATTERN = [ 500, 1000, 500, 1000] ;
  let vibrateCount = 0;

  /*
  Pixel ratio variable to get dimensions
  */
  const {width, height} = require('Dimensions').get('window');

class Stopwatch extends Component {

  state = {
    secondsElapsed: this.props.stopwatch.secondsElapsed || 0,
    laps: this.props.stopwatch.laps || [],
    lastClearedIncrementer: this.props.stopwatch.lastClearedIncrementer || null,
    avgBall: this.props.stopwatch.avgBall || [],
    avgSeconds: this.props.stopwatch.avgSeconds || 0,
    incrementer: this.props.stopwatch.incrementer || null,
    settings: this.props.settings.settings || '33',
    togglePremium: this.props.toggle.togglePremium || true,
    toggleVibrate: this.props.toggleVibrate.toggleVibrate || true,
    over: this.props.ball.over || 0,
    settings: this.props.settings.settings || '33',

  };

  incrementer = () => {
    let incrementer = null;
    this.setState({incrementer: this.props.stopwatch.incrementer});
  }

  //handleChange = ( stopwatch, settings_threshold, settings_vibrate ) => {
  handleChange = ( stopwatch, toggle, ball, toggleVibrate, settings ) => {
    console.log(stopwatch);
    this.setState({ stopwatch });
    this.setState({ toggle });
    this.setState({ ball });
    this.setState({ toggleVibrate });
    this.setState({ settings });

    //this.setState({ settings_threshold });
    //this.setState({ settings_vibrate });
  };

  componentDidUpdate() {
    if(this.animatedTextRefThree) {

    //turn latestPartnership and this.props.partnership.highestPartnership into numeric values
    let avgSecondsNum = Number(this.props.stopwatch.avgSeconds);
    let secElapsedNum = Number(this.props.stopwatch.secondsElapsed);
    let thresholdNum = Number(this.props.settings.settings);
    let overNum = Number(this.props.ball.over);

    let thresholdDividedNum = thresholdNum / 100;
    thresholdDividedNum+=1

    let thresholdTotalNum = avgSecondsNum * thresholdDividedNum;
    thresholdTotalNum = thresholdTotalNum.toFixed(1);

    //avgSecondsNum *= 1.33;

    console.log(this.props.toggle.togglePremium);

    console.log(this.props.stopwatch.secondsElapsed);
    console.log(this.props.stopwatch.avgSeconds);
    console.log(avgSecondsNum);
    console.log(this.props.toggle.togglePremium === true);
    let vib = false;
    if (this.props.toggle.togglePremium === true || this.props.ball.over < 10) {
      vib = true;
    }

    console.log(secElapsedNum);
    console.log(thresholdTotalNum);
    console.log(this.props.toggleVibrate.toggleVibrate);
    console.log(vib);

    let toggleVibrate = this.props.toggleVibrate.toggleVibrate;

    console.log(toggleVibrate);

    if (secElapsedNum > thresholdTotalNum && (toggleVibrate === 'true' || toggleVibrate === true) && vib === true ) {
      this.animatedTextRefThree.startAnimation(500,() => {})
      console.log('is this hit? vibrate/animation for time.');

      if (vibrateCount <= 2) {
        //Vibration.vibrate(PATTERN);
        ReactNativeHapticFeedback.trigger('notificationWarning', true);
        vibrateCount += 1;
        console.log(vibrateCount);
      }
    }
    else if (secElapsedNum === 0) {
      vibrateCount = 0;
    }
  }
}


  render() {
    console.log(this.props.stopwatch.secondsElapsed + " seconds elapsed Stopwatch.");
    return (
        <Animatable.Text animation="bounceIn" style={styles.button_text} ref={ci => this.animatedTextRefThree = ci}>{formattedSeconds(this.props.stopwatch.secondsElapsed)}</Animatable.Text>
    );
  }
}

const mapStateToProps = state => ({
  stopwatch: state.stopwatch,
  settings: state.settings,
  toggle: state.toggle,
  ball: state.ball,
  toggleVibrate: state.toggleVibrate,
  settings: state.settings,
});

export default connect(mapStateToProps)(Stopwatch);

// Custom Styles
//const width = Dimensions.get('window').width;
//const height = Dimensions.get('window').height;
const styles = StyleSheet.create({
  button_text: {
  fontSize: PixelRatio.get() === 2 && Platform.OS === 'ios' && (height <= 568) ? 20 : PixelRatio.get() === 1 ? 22 : PixelRatio.get() === 1.5 ? 25 : PixelRatio.get() === 2 ? 26 : 28,
  color: '#ffffff',
  margin: 0,
  padding: 0,
},
});
