import React, { Component } from 'react';

import { Container, Footer, Text, Button, Icon } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio, Platform, Dimensions } from 'react-native';
import { connect } from "react-redux";

import { updateRuns } from '../../Reducers/runs';
import { updateOver } from '../../Reducers/over';

import BallDiff from '../../Util/BallDiff.js';

/*
animation prackage
*/
import * as Animatable from 'react-native-animatable';

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
    rowPadding: {
      bottom: PixelRatio.get() === 2 && Platform.OS === 'ios' ? 5 : 5,
    },
    runCountStyling: {
      color: '#fff',
      fontSize: PixelRatio.get() === 1 ? 30 : PixelRatio.get() === 1.5 ? 35 : PixelRatio.get() === 2 && (width < 414) ? 35 : PixelRatio.get() === 2 && (width === 414) ? 55 : 55,
    },
    overCountStyling: {
      color: '#eee',
      fontSize: PixelRatio.get() === 1 ? 10 : PixelRatio.get() === 1.5 ? 15 : PixelRatio.get() === 2 && (width < 414) ? 20 : PixelRatio.get() === 2 && (width === 414) ? 25 : 25,
      position: 'absolute',
      bottom: 5,
    },
});

class RunsTotal extends Component {

  state = {
    runs: this.props.runs.runs || 0,
    runEvents: this.props.runs.runEvents || [],
    eventID: this.props.runs.eventID || 0,
    firstWicketIndex: this.props.runs.firstWicketIndex || 0,
    secondWicketIndex: this.props.runs.secondWicketIndex || 0,
    highestRunsPartnership: this.props.runs.highestRunsPartnership || [],
    ball: this.props.ball.ball || 0,
    over: this.props.ball.over || 0,
  };

  handleChange = ( runs, ball ) => {
    this.setState({ runs });
    this.setState({ ball });
  };

  componentDidUpdate() {

    let runEvents = this.props.runs.runEvents;
    //let lastRunEvent = runEvents.splice(-1,1);
    //console.log(lastRunEvent);
    let lastEventNumber = runEvents.length-1;
    console.log(lastEventNumber);
    let runEventsLast = runEvents[lastEventNumber];
    console.log(runEventsLast);
        if (runEventsLast.runsValue === 0 && runEventsLast.runExtras === 0 ) {
          console.log('runEvent.runsValue === 0 && runEvent.runExtras === 0');
          if(this.animatedTextRef) {
            this.animatedTextRef.startAnimation(2000,() => {})
          }
        }
        else {
          if(this.animatedTextRefOne) {
         this.animatedTextRefOne.startAnimation(3000,() => {})
          }
        }
}

getRunRate() {
  let firstWicketIndex = this.props.runs.firstWicketIndex;
  let secondWicketIndex = this.props.runs.secondWicketIndex;
  let runEvents = this.props.runs.runEvents;
  let sum = a => a.reduce((acc, item) => acc + item);

//----------calculate overs
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
let overValue = totalOver + '.' +  totalBall;
console.log(overValue);
let numberOverValue = Number(overValue);

//---------- end of calularte overs

//Calculate the total runs
let totalBatRuns = sum(runEvents.map(acc => Number(acc.runsValue)));
console.log(totalBatRuns);
let totalExtraRuns = sum(runEvents.map(acc => Number(acc.runExtras)));
console.log(totalExtraRuns);
let totalRuns = totalBatRuns + totalExtraRuns;
console.log(totalRuns);

//workout run rate:
let runRate = totalRuns / numberOverValue;
console.log(runRate);

if (numberOverValue < 1) {
  let runRateOneDecimal = '';
  return ['RR: ~'];
}
else {
  let runRateOneDecimal = parseFloat(runRate).toFixed(1);
  return ['RR: ' + runRateOneDecimal];
}

}


getDisplayRunsTotal() {

  let firstWicketIndex = this.props.runs.firstWicketIndex;
  let secondWicketIndex = this.props.runs.secondWicketIndex;
  let eventID = this.props.runs.eventID;
  let highestRunsPartnership = this.props.runs.highestRunsPartnership;

  console.log(this.props.runs.runEvents);
  let runEvents = this.props.runs.runEvents;
  let runExtras = this.props.runs.runExtras;

  //Calculate the total runs
/*
    console.log(runEvents.length);
    if (!runEvents.length) {
        runEvents.push({eventID: 0, runsValue: 0, ball: -1, wicketEvent: false});
      }
      */

  let sum = a => a.reduce((acc, item) => acc + item);
  let totalBatRuns = sum(runEvents.map(acc => Number(acc.runsValue)));
  console.log(totalBatRuns);
  let totalExtraRuns = sum(runEvents.map(acc => Number(acc.runExtras)));
  console.log(totalExtraRuns);
  let totalRuns = totalBatRuns + totalExtraRuns;
  console.log(totalRuns);

  //Get total wickets
  let getWicketCount = BallDiff.getWicketCount(runEvents);
  let totalWickets = getWicketCount[0];
  console.log(totalWickets);



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

  return [totalRuns, totalWickets, totalOver, totalBall]
}

displayRunsTotal() {

  let display = this.getDisplayRunsTotal();
  let totalRuns = display[0];
  let totalWickets = display[1];
  let totalOver = display[2];
  let totalBall = display[3];

  let getRunRate = this.getRunRate();
  let runRate = getRunRate[0];


  return (
    <Col style={styles.rowContainer} size={2}>
      <Row style={{flexDirection: 'row', justifyContent: 'flex-end', marginRight: 5}} size={6}>
    <Animatable.Text animation="bounceIn" style={styles.runCountStyling} ref={ci => this.animatedTextRefOne = ci}>
      {totalRuns}/{totalWickets}
    </Animatable.Text>
    </Row>
    <Row style={{marginLeft: 5}} size={6}>
    <Animatable.Text animation="bounceIn" style={styles.overCountStyling} ref={ci => this.animatedTextRef = ci}>
      ({totalOver}.{totalBall}, {runRate})
    </Animatable.Text>
    </Row>
  </Col>
  );
  }

  render() {

    return (
        <Grid>
          <Row size={10} style={styles.rowPadding}>

              {this.displayRunsTotal()}

            </Row>
        </Grid>
    );
  }
}

const mapStateToProps = state => ({
  runs: state.runs,
  ball: state.ball,
});

export default connect(mapStateToProps)(RunsTotal);

/*findIndex not to be used but keeping incase i need to use:
const indexOfWickets = runEvents.findIndex(x => x.wicketEvent === true);
console.log(indexOfWickets);
*/
