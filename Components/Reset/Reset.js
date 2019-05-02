import React, { Component, applyMiddleware, createStore } from 'react';
import { persistStore } from 'redux-persist';

/*
Native base and react native
*/
import { Container, Footer, H2, Text, Icon, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio } from 'react-native';

/*
Redux imports
*/
import { connect } from "react-redux";

import { updateStopwatch } from '../../Reducers/stopwatch';
import { updateRuns } from '../../Reducers/runs';
import { updateOver } from '../../Reducers/over';
import { updateStoptimer } from '../../Reducers/stoptimer';
import { updateReset } from '../../Reducers/reset';
//import { updateToggle } from '../../Reducers/toggle';


class Reset extends Component {
  state = {
    runs: 0,
    runEvents: [{eventID: 0, runsValue: 0, ball: -1, wicketEvent: false, runExtras: 0, runsType: 'deleted'}],
    eventID: 0,
    firstWicketIndex: 0,
    secondWicketIndex: 0,
    highestRunsPartnership: [],
    ball: 0,
    over: 0,
    secondsElapsed: 0,
    laps: [],
    lastClearedIncrementer: null,
    incrementer: null,
    avgBall: [],
    avgSeconds: 0,
    stoptimer: false,
        //togglePremium: false,
  };

  handleChange = ( runs, ball, stopwatch, stoptimer, reset ) => {
    this.setState({ runs });
    this.setState({ ball });
    this.setState({ stopwatch });
    this.setState({ stoptimer });
    this.setState({ reset });
    //this.setState({ toggle });
  };

incrementer = () => {
  console.log(this.state.incrementer);
  let incrementer = null;
  console.log(incrementer);
  this.setState({incrementer: incrementer});
}


handleStopClick = () => {
  console.log('stop hit');
    clearInterval(this.props.stopwatch.incrementer);

      let lastClearedIncrementer = this.props.stopwatch.lastClearedIncrementer;
      let secondsElapsed = this.props.stopwatch.secondsElapsed;
      let laps = this.props.stopwatch.laps;
      let incrementer = this.props.stopwatch.incrementer;

      let highestPartnership = this.props.highestPartnership;
      let partnerships = this.props.partnerships;
      let currentPartnership = this.props.currentPartnership;
      let avgWicket = this.props.avgWicket;


      this.props.addStopwatch({ secondsElapsed, laps, lastClearedIncrementer, incrementer });
      console.log(this.props.addStopwatch({ secondsElapsed, laps, lastClearedIncrementer, incrementer }));
      this.props.updatePartnership({highestPartnership, partnerships, currentPartnership, avgWicket});
      console.log(this.props.updatePartnership({highestPartnership, partnerships, currentPartnership, avgWicket}));
    this.resetBuilder();
  }

  handleStopClick = () => {
      clearInterval(this.props.stopwatch.incrementer);
      this.setState({
        lastClearedIncrementer: this.props.stopwatch.incrementer
      });
    }


    resetBuilder = () => {
      let reset = 2;
      this.setState({reset: reset}
        , function () {
          console.log(this.props.reset.reset  + ' reset');
          const { reset } = this.state
          this.props.dispatch(updateReset(this.state.reset))
        });

        //this.setState(this.baseState);

        let over = 0;
        let ball = 0;
        this.props.dispatch(updateOver(ball, over));


        let secondsElapsed = 0;
        let laps = [];
        let lastClearedIncrementer = null;
        let incrementer = null;
        let avgBall = [];
        let avgSeconds = 0;
        this.props.dispatch(updateStopwatch( secondsElapsed, laps, lastClearedIncrementer, incrementer, avgBall, avgSeconds ));


        let runs = 0;
        let runEvents = [{eventID: 0, runsValue: 0, ball: -1, wicketEvent: false, runExtras: 0, runsType: 'deleted'}];
        let eventID = 0;
        let firstWicketIndex = 0;
        let secondWicketIndex = 0;
        let highestRunsPartnership = [];
        this.props.dispatch(updateRuns(runs, runEvents, eventID, firstWicketIndex, secondWicketIndex, highestRunsPartnership))

        let stoptimer = false;
        this.props.dispatch(updateStoptimer(stoptimer));


        reset = 2;
        this.props.dispatch(updateReset(reset))

        //let toggle = false;
        //this.props.dispatch(updateToggle(toggle))

    }


  render() {
    return (
        <Button rounded large warning style={styles.largeButton} onPress={this.resetBuilder}>
          <Text style={styles.buttonTextBack}>Yes</Text>
        </Button>
    );
  }
}

const mapStateToProps = state => ({
  ball: state.ball,
  reset: state.reset,
  stopwatch: state.stopwatch,
  runs: state.runs,
  stoptimer: state.stoptimer,
  //toggle: state.toggle,
});

export default connect(mapStateToProps)(Reset);

// Custom Styles
const styles = StyleSheet.create({
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
    }
});
