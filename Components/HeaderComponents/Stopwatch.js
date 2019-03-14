import React, { Component } from 'react';

/*
Native base and react native
*/
import { Container, Footer, H2, H1, Text, Icon, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, Vibration, PixelRatio } from 'react-native';

/*
vibrate import
*/
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

/*
Redux Imports*/
import { connect } from "react-redux";
import { updateStopwatch } from '../../Reducers/stopwatch';
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
    //settings_threshold: this.props.settings.settings_threshold || 33,
    //settings_vibrate: this.props.settings.settings_vibrate || 'on',
  };

  incrementer = () => {
    let incrementer = null;
    this.setState({incrementer: this.props.stopwatch.incrementer});
  }

  //handleChange = ( stopwatch, settings_threshold, settings_vibrate ) => {
  handleChange = stopwatch => {
    console.log(stopwatch);
    this.setState({ stopwatch });
    //this.setState({ settings_threshold });
    //this.setState({ settings_vibrate });
  };

  componentDidUpdate() {
    if(this.animatedTextRefThree) {

    //turn latestPartnership and this.props.partnership.highestPartnership into numeric values
    let avgSecondsNum = Number(this.props.stopwatch.avgSeconds);
    let secElapsedNum = Number(this.props.stopwatch.secondsElapsed);

    avgSecondsNum *= 1.33;

    console.log(avgSecondsNum);

    console.log(this.props.stopwatch.secondsElapsed);
    console.log(this.props.stopwatch.avgSeconds);
    console.log(avgSecondsNum);
    if (secElapsedNum > avgSecondsNum) {
      this.animatedTextRefThree.startAnimation(500,() => {})

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
  //settings: state.settings,
});

export default connect(mapStateToProps)(Stopwatch);

// Custom Styles
const styles = StyleSheet.create({
  button_text: {
  fontSize: PixelRatio.get() === 1 ? 22 : PixelRatio.get() === 1.5 ? 25 : PixelRatio.get() === 2 ? 26 : 28,
  color: '#ffffff',
  margin: 0,
  padding: 0
},
});
