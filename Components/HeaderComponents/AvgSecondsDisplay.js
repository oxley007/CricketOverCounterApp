import React, { Component } from 'react';

/*
Native base and react native
*/
import { Container, Footer, H2, H1, Text, Icon, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View } from 'react-native';

/*
Redux Imports
*/
import { connect } from "react-redux";
import { updateStopwatch } from '../../Reducers/stopwatch';


class AvgSecondsDisplay extends Component {


    state = {
      secondsElapsed: this.props.stopwatch.secondsElapsed || 0,
      laps: this.props.stopwatch.laps || [],
      lastClearedIncrementer: this.props.stopwatch.lastClearedIncrementer || null,
      avgBall: this.props.stopwatch.avgBall || [],
      avgSeconds: this.props.stopwatch.avgSeconds || 0,
      incrementer: this.props.stopwatch.incrementer || null,
    };

    handleChange = stopwatch => {
      this.setState({ stopwatch });
    };



  avgSecondsDisplay = () => {
    if (isNaN(parseFloat(this.props.stopwatch.avgSeconds))) {
      return (
      <Text style={{fontSize: 8, height: 15, top: 0, color: '#fff'}}>(Avg: 0sec)</Text>
    )
    }
    else if (this.props.stopwatch.secondsElapsed === 120) {
      return <Text style={{fontSize: 8, height: 15, top: 0, color: '#fff'}}>(PAUSED)</Text>
    }
    else {
    return (
      <Col>
        <Row style={{marginBottom: 10}}>
          <Text style={{fontSize: 12, lineHeight: 12, height: 12, color: '#fff'}}>Avg: </Text>
        </Row>
        <Row>
          <Text style={{fontSize: 12, lineHeight: 12, height: 12, color: '#fff'}}>{this.props.stopwatch.avgSeconds}sec</Text>
        </Row>
      </Col>
      )
      }
    }

  render() {
    return (
      <Col>
      {this.avgSecondsDisplay()}
    </Col>
    );
  }
}


const mapStateToProps = state => ({
  stopwatch: state.stopwatch,
});

export default connect(mapStateToProps)(AvgSecondsDisplay);
