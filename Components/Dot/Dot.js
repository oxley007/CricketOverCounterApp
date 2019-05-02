import React, { Component } from 'react';

import { Container, Footer, Text, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio, Platform, Dimensions } from 'react-native';
import { connect } from "react-redux";

import Icon from 'react-native-vector-icons/Entypo';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import BallDiff from '../../Util/BallDiff.js';

import { updateStopwatch } from '../../Reducers/stopwatch';
import { updateRuns } from '../../Reducers/runs';
import { updateOver } from '../../Reducers/over';
import { updateStoptimer } from '../../Reducers/stoptimer';


/*
Native Base StyleSheet
*/
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
const styles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 10,
    },
    largeCircle: {
      height: PixelRatio.get() === 1.5 && Platform.OS === 'android' ? 70 :
      PixelRatio.get() === 2 && Platform.OS === 'android' ? 70 :
      PixelRatio.get() === 3 && Platform.OS === 'android' && (width >= 414) ? 70 :
       PixelRatio.get() === 3 && Platform.OS === 'android' && (width < 414) ? 70 :
       PixelRatio.get() === 3.5 && Platform.OS === 'android' ? 90 : 90,
      width: PixelRatio.get() === 1.5 && Platform.OS === 'android' ? 70 :
      PixelRatio.get() === 2 && Platform.OS === 'android' ? 70 :
      PixelRatio.get() === 3 && Platform.OS === 'android' && (width >= 414) ? 70 :
       PixelRatio.get() === 3 && Platform.OS === 'android' && (width < 414) ? 70 :
       PixelRatio.get() === 3.5 && Platform.OS === 'android' ? 90 : 90,
    },
    largeIcon: {
      fontSize: 65,
      color: '#c471ed',
      marginTop: 'auto',
      marginRight: 'auto',
      marginBottom: 'auto',
      marginLeft: 'auto',
    },
    rowPadding: {
      bottom: PixelRatio.get() === 1.5 && Platform.OS === 'android' ? 5 :
      PixelRatio.get() === 2 && Platform.OS === 'android' ? 5 :
      PixelRatio.get() === 2 && Platform.OS === 'ios' && (height <= 568) ? 20 :
      PixelRatio.get() === 3 && Platform.OS === 'android' && (width >= 414) ? 5 :
       PixelRatio.get() === 3 && Platform.OS === 'android' && (width < 414) ? 0 :
       PixelRatio.get() === 2 && Platform.OS === 'ios' ? 40 :
       PixelRatio.get() === 3.5 && Platform.OS === 'android' ? 5 : 5,
    },
    iconStyling: {
      color: '#c471ed',
      fontSize: PixelRatio.get() === 1.5 && Platform.OS === 'android' ? 60 :
      PixelRatio.get() === 2 && Platform.OS === 'android' ? 60 :
      PixelRatio.get() === 3 && Platform.OS === 'android' && (width >= 414) ? 60 :
       PixelRatio.get() === 3 && Platform.OS === 'android' && (width < 414) ? 60 :
        PixelRatio.get() === 3.5 && Platform.OS === 'android' ? 60 : 80,
      marginLeft:PixelRatio.get() === 1.5 && Platform.OS === 'android' ? 5 :
      PixelRatio.get() === 2 && Platform.OS === 'android' ? 5 :
      PixelRatio.get() === 3 && Platform.OS === 'android' && (width >= 414) ? 5 :
       PixelRatio.get() === 3 && Platform.OS === 'android' && (width < 414) ? 5 :
        PixelRatio.get() === 3.5 && Platform.OS === 'android' ? 5 : 'auto',
      marginRight: 'auto',
      marginTop: 'auto',
      marginBottom: 'auto',
      justifyContent: 'center'
    }
});

const formattedSeconds = (sec) =>
  Math.floor(sec / 60) +
    '.' +
  ('0' + sec % 60).slice(-2)

class Dot extends Component {

  state = {
    runs: this.props.runs.runs || 0,
    runEvents: this.props.runs.runEvents || [],
    eventID: this.props.runs.eventID || 0,
    highestRunsPartnership: this.props.runs.highestRunsPartnership || [],
    ball: this.props.ball.ball || 0,
    over: this.props.ball.over || 0,
    secondsElapsed: this.props.stopwatch.secondsElapsed || 0,
    laps: this.props.stopwatch.laps || [],
    lastClearedIncrementer: this.props.stopwatch.lastClearedIncrementer || null,
    incrementer: this.props.stopwatch.incrementer || null,
    avgBall: this.props.stopwatch.avgBall || [],
    avgSeconds: this.props.stopwatch.avgSeconds || 0,
    stoptimer: this.props.stoptimer.stoptimer || false,
  };

  handleChange = ( runs, ball ) => {
    this.setState({ runs });
    this.setState({ ball });
    this.setState({ stopwatch });
    this.setState({ stoptimer });
  };

  incrementer = () => {
    console.log(this.state.incrementer);
    let incrementer = null;
    console.log(incrementer);
    this.setState({incrementer: incrementer});
  }

  stopwatch = () => {

    let runEvents = this.props.runs.runEvents;
    //let lastRunEvent = runEvents.splice(-1,1);
    //console.log(lastRunEvent);
    let lastEventNumber = runEvents.length-1;
    console.log(lastEventNumber);
    let runEventsLast = runEvents[lastEventNumber];

    let sum = a => a.reduce((acc, item) => acc + item);

    //----------calculate overs
    let over = this.props.ball.over;
    let ball = 0;

    let legitBall = BallDiff.getLegitBall(ball, runEvents);
    let ballTotal = legitBall[0];
    console.log(ballTotal);

    ball = sum(ballTotal.map(acc => Number(acc)));
    console.log(ball);

    let totalBallDiff = BallDiff.getpartnershipDiffTotal(ball);
    let totalOver = totalBallDiff[0];
    console.log(totalOver);

    let totalBall = totalBallDiff[1];
    console.log(totalBall);
    console.log(totalOver + '.' +  totalBall);
    //---------- end of calularte overs

    /*
    Work out the average seconds ecslipsed by adding to the array
    */
      let secondsElapsed = this.props.stopwatch.secondsElapsed;
      //let formattedAvgSeconds = formattedSeconds(secondsElapsed);
      //console.log(formattedAvgSeconds);
      let avgBalls = this.props.stopwatch.avgBall;
      console.log(this.props.stopwatch.avgBall);
      console.log(this.props.stopwatch.secondsElapsed);

      if (totalBall >= 1 && totalBall <= 5) {
        console.log('hit and should be if ball 0 or 6');
      avgBalls.push(secondsElapsed);
    }


      //let avgSeconds = avgBalls[avgBalls.length - 1];
      let total = 0;
      for(var i = 0; i < avgBalls.length; i++) {
      let num = parseFloat(avgBalls[i]);
      console.log(num);
      total += num;
      }
      let avgSecondsFull = total / avgBalls.length;
      console.log(avgSecondsFull);
      var avgSeconds = avgSecondsFull.toFixed(0);

    /*
    First clear the timer
    */
    //clearInterval(this.state.incrementer);
    console.log(this.props.stopwatch.incrementer);
    console.log(this.state.incrementer);
    clearInterval(this.incrementer);
    this.setState({
      secondsElapsed: 0,
      laps: [],
      lastClearedIncrementer: null,
      incrementer: null,
      avgBall: avgBalls,
      avgSeconds: avgSeconds,
    }, function () {
      const { secondsElapsed, laps, lastClearedIncrementer, incrementer, avgBall, avgSeconds } = this.state;
      this.props.dispatch(updateStopwatch( this.state.secondsElapsed, this.state.laps, this.state.lastClearedIncrementer, this.state.incrementer, this.state.avgBall, this.state.avgSeconds ));
      //this.props.addStopwatch({ secondsElapsed, laps });
    });

    /*
    Then start the timer
    */

      console.log(this.props.stoptimer.stoptimer);
      this.incrementer = setInterval( () =>
          this.setState({
            secondsElapsed: this.props.stopwatch.secondsElapsed + 1,
            laps: [],
            lastClearedIncrementer: null,
            incrementer: null,
            avgBall: avgBalls,
            avgSeconds: avgSeconds,
          },  function () {
            console.log(this.props.stoptimer.stoptimer);
            if (this.props.stopwatch.secondsElapsed >= 120) {
              this.handleStopClick();
            }
            else if (totalBall === 5 || runEventsLast.runsType.includes('WICKET')) {
              //don't do anything.
            }
            else if ( this.props.stoptimer.stoptimer === false ) {
              //const { secondsElapsed, laps, lastClearedIncrementer, incrementer, avgBall, avgSeconds } = this.state;
              //this.props.dispatch(updateStopwatch( this.state.secondsElapsed, this.state.laps, this.state.lastClearedIncrementer, this.state.incrementer, this.state.avgBall, this.state.avgSeconds ));
              //this.handleStopClickTwo(avgBalls, avgSeconds);
              this.handleStopClick()
            }
            else {
            const { secondsElapsed, laps, lastClearedIncrementer, incrementer, avgBall, avgSeconds } = this.state;
            this.props.dispatch(updateStopwatch( this.state.secondsElapsed, this.state.laps, this.state.lastClearedIncrementer, this.state.incrementer, this.state.avgBall, this.state.avgSeconds ));
            }
          }), 1000);

  }

  handleStopClick = () => {
    clearInterval(this.props.stopwatch.incrementer);
    this.setState({
      lastClearedIncrementer: this.props.stopwatch.incrementer
    });
    }

    handleStopClickTwo = (avgBalls, avgSeconds) => {
      clearInterval(this.props.stopwatch.incrementer);

      this.setState({
        secondsElapsed: this.props.stopwatch.secondsElapsed,
        laps: [],
        lastClearedIncrementer: this.props.stopwatch.incrementer,
        incrementer: null,
        avgBall: avgBalls,
        avgSeconds: avgSeconds,
      }, function () {
        const { secondsElapsed, laps, lastClearedIncrementer, incrementer, avgBall, avgSeconds } = this.state;
        this.props.dispatch(updateStopwatch( this.state.secondsElapsed, this.state.laps, this.state.lastClearedIncrementer, this.state.incrementer, this.state.avgBall, this.state.avgSeconds ));
      });
      }


addDot = () => {

  ReactNativeHapticFeedback.trigger('impactLight', true);

  let firstWicketIndex = this.props.runs.firstWicketIndex;
  let secondWicketIndex = this.props.runs.secondWicketIndex;
  let highestRunsPartnership =  this.props.runs.highestRunsPartnership;

  let eventID = this.props.runs.eventID;
  let totalRuns = this.props.runs.runs;
  console.log(totalRuns);

  let runEvents = this.props.runs.runEvents;
  console.log(runEvents);

/*
  //check to see if run stopwatch or stop stopwatch.
  let lastEventNumber = runEvents.length-1;
  console.log(lastEventNumber);
  let runEventsLast = runEvents[lastEventNumber];
  console.log(runEventsLast);
      if (runEventsLast.runsValue === 0 && runEventsLast.runExtras === 0 ) {
        console.log('runEvent.runsValue === 0 && runEvent.runExtras === 0');
        this.handleStopClick();
        this.stopwatch();
      }
      else {
        console.log('not starting stopwatch' + runEventsLast.runsValue + ' ' + runEventsLast.runExtras);
      }
      */

      let stoptimer = true;

      console.log(stoptimer);

      this.setState({
        stoptimer: stoptimer,
      }, function () {
        console.log(stoptimer);
        const { stoptimer } = this.state
        console.log(this.state.stoptimer);
        this.props.dispatch(updateStoptimer(this.state.stoptimer));
      })

      console.log(this.props.stoptimer.stoptimer);

        this.stopwatch();


  eventID++

  let over = this.props.ball.over;
  let ball = this.props.ball.ball;
  console.log(ball);
  ball++

  runEvents.push({eventID: eventID, runsValue: 0, ball: ball, wicketEvent: false, runExtras: 0, runsType: 'dot'});
  console.log(runEvents);

  //let ballCount = BallCount.getBallCount(runs);
  //let totalRuns = ballCount[0];

  this.setState({
    runs: totalRuns,
    runEvents: runEvents,
    eventID: eventID,
    firstWicketIndex: firstWicketIndex,
    secondWicketIndex: secondWicketIndex,
    highestRunsPartnership: highestRunsPartnership,
  }, function () {
    const { runs, runEvents, eventID, firstWicketIndex, secondWicketIndex, highestRunsPartnership } = this.state
    this.props.dispatch(updateRuns(this.state.runs, this.state.runEvents, this.state.eventID, this.state.firstWicketIndex, this.state.secondWicketIndex, this.state.highestRunsPartnership));
  })

  this.setState({
    ball: ball,
    over: over,
  }, function () {
    const { ball, over } = this.state
    this.props.dispatch(updateOver(this.state.ball, this.state.over));
  })

}

  render() {

    return (
        <Grid>
          <Row size={10} style={styles.rowPadding}>
            <Col style={styles.rowContainer} size={2}>
              <Button rounded large style={styles.largeCircle} light onPress={this.addDot} title="Click me">
                <Icon name='dot-single' style={styles.iconStyling} />
              </Button>
            </Col>
          </Row>
        </Grid>
    );
  }
}

//<Text style={{fontSize:30, marginLeft: 'auto', marginRight: 'auto', marginTop: 'auto', marginBottom: 'auto', justifyContent: 'center',}}>.</Text>

const mapStateToProps = state => ({
  runs: state.runs,
  ball: state.ball,
  stopwatch: state.stopwatch,
  stoptimer: state.stoptimer,
});

export default connect(mapStateToProps)(Dot);
