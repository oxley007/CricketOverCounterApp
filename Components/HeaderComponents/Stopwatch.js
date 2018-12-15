import React, { Component } from 'react';

/*
Native base and react native
*/
import { Container, Footer, H2, H1, Text, Icon, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View } from 'react-native';

/*
Redux Imports*/
import { connect } from "react-redux";
import { updateStopwatch } from '../../Reducers/stopwatch';


const formattedSeconds = (sec) =>
  Math.floor(sec / 60) +
    ':' +
  ('0' + sec % 60).slice(-2)



class Stopwatch extends Component {

  state = {
    secondsElapsed: this.props.stopwatch.secondsElapsed || 0,
    laps: this.props.stopwatch.laps || [],
    lastClearedIncrementer: this.props.stopwatch.lastClearedIncrementer || null,
    avgBall: this.props.stopwatch.avgBall || [],
    avgSeconds: this.props.stopwatch.avgSeconds || 0,
    incrementer: this.props.stopwatch.incrementer || null,
  };

  incrementer = () => {
    let incrementer = null;
    this.setState({incrementer: this.props.stopwatch.incrementer});
  }

  handleChange = stopwatch => {
    console.log(stopwatch);
    this.setState({ stopwatch });
  };

  render() {
    console.log(this.props.stopwatch.secondsElapsed + " seconds elapsed Stopwatch.");
    return (
        <H1 style={{color: '#fff'}}>{formattedSeconds(this.props.stopwatch.secondsElapsed)}</H1>
    );
  }
}

const mapStateToProps = state => ({
  stopwatch: state.stopwatch,
});

export default connect(mapStateToProps)(Stopwatch);
