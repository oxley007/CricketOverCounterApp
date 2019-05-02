import React, { Component } from 'react';

import { Container, Footer, Text, Button, Icon, H3, H1 } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio, Platform, Dimensions } from 'react-native';
import { connect } from "react-redux";

import { updateRuns } from '../../Reducers/runs';
import { updateOver } from '../../Reducers/over';

import BallDiff from '../../Util/BallDiff.js';

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
      bottom: PixelRatio.get() === 2 && Platform.OS === 'ios' ? 40 : 5,
    },
    textDesc: {
      color: '#eee',
      fontWeight: '100',
      marginTop: 0,
    },
    colCenter: {
      alignItems: 'center',
    },
    verticleRule: {
      borderRightColor: '#fff',
      borderRightWidth: 0.5,
      height: '100%',
    },
    currentPartnershipNumber: {
      fontSize: PixelRatio.get() === 1 ? 24 : PixelRatio.get() === 1.5 ? 30 : PixelRatio.get() === 2 && (width < 414) ? 30 : PixelRatio.get() === 2 && (width === 414) ? 36 : 40,
      color: '#fff',
      lineHeight: PixelRatio.get() === 1 ? 24 : PixelRatio.get() === 1.5 ? 30 : PixelRatio.get() === 2 && (width < 414) ? 30 : PixelRatio.get() === 2 && (width === 414) ? 36 : 40,
    },
    textHeader: {
      color: '#fff',
      textAlign: 'center',
      marginBottom: 10,
      fontWeight: '300',
      fontSize: PixelRatio.get() === 1 ? 16 : PixelRatio.get() === 1.5 ? 18 : PixelRatio.get() === 2 && (width < 414) ? 22 : PixelRatio.get() === 2 && (width === 414) ? 24 : PixelRatio.get() === 3.5 ? 24 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 20 : PixelRatio.get() === 3 && (width === 414) && Platform.OS === 'ios' ? 24 : 22,
    },

});

class HighestPartnership extends Component {

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


  displayHighestPartnership() {

    let firstWicketIndex = this.props.runs.firstWicketIndex;
    let secondWicketIndex = this.props.runs.secondWicketIndex;
    let eventID = this.props.runs.eventID;
    let highestRunsPartnership = this.props.runs.highestRunsPartnership;
    let totalRuns = this.props.runs.runs;

    console.log(this.props.runs.runEvents);
    let runEvents = this.props.runs.runEvents;

    console.log(highestRunsPartnership.length);
    if (!highestRunsPartnership.length) {
        console.log('!highestRunsPartnership.length hit');
        highestRunsPartnership.push(0);
      }

        let sum = a => a.reduce((acc, item) => acc + item);

    //Calculate the highest partnership in runsType
    //loop through and log index of each wicket:
    runEvents.map((currElement, index) => {
      console.log(currElement.wicketEvent + ' ' + index);
    if (currElement.wicketEvent === true)
      {
        console.log('should only be hit on a wicket.');
        firstWicketIndex++
        let firstWicketFlag = 1
        console.log("The current iteration is: " + index);
        console.log("The current element is: " + currElement.wicketEvent);


        if (firstWicketIndex === 1) {
          console.log('first index is null');
          firstWicketIndex = 0;
          console.log(firstWicketIndex + ' firstWicketIndex');
          secondWicketIndex = index;
          console.log(secondWicketIndex + ' secondWicketIndex');
          firstWicketFlag = 2;
        }
        else {
          console.log('else do this');
          firstWicketIndex = secondWicketIndex;
          console.log(firstWicketIndex  + ' firstWicketIndex');
          secondWicketIndex = index;
          console.log(secondWicketIndex  + ' secondWicketIndex');
        }

        let totalHighpartnershipRunValue = sum(runEvents.slice(firstWicketIndex,secondWicketIndex).map(acc => Number(acc.runsValue)));
        let totalHighpartnershipExtraValue = sum(runEvents.slice(firstWicketIndex,secondWicketIndex).map(acc => Number(acc.runExtras)));
        //let totalRuns = sum(runEvents.map(acc => Number(acc.runsValue)));
        let totalHighpartnershipValue = totalHighpartnershipRunValue + totalHighpartnershipExtraValue;
        console.log(totalHighpartnershipValue);

        //Need to change the firstWicketFlag to a firstWicketIndex of more than 1.
        if (firstWicketFlag === 2) {
          firstWicketIndex = 2;
        }


        console.log(highestRunsPartnership);
        //runEvents.slice(secondWicketIndex) acc => Number(acc.runsValue)));
        let highRunPartnershipCheck = Math.max.apply(null, highestRunsPartnership);
        if (totalHighpartnershipValue > highRunPartnershipCheck) {
        highestRunsPartnership.push(totalHighpartnershipValue);
        console.log(highestRunsPartnership);
        }
      }
    });

    //then use max to find highest partenership and store in state.
    let highRunPartnership = Math.max.apply(null, highestRunsPartnership);


    return (
      <Col>
        <Row>
          <Col style={styles.colCenter}>
            <Row>
              <H3 style={styles.textHeader}>Highest Partnership</H3>
            </Row>
            <Row>
              <H1 style={styles.currentPartnershipNumber}>
                {highRunPartnership}
              </H1>
            </Row>
            <Row>
              <Text style={styles.textDesc}>runs</Text>
            </Row>
          </Col>
      </Row>
      </Col>
    );
  }

  render() {
    return (
        <Grid>
          {this.displayHighestPartnership()}
        </Grid>
    );
  }
}

const mapStateToProps = state => ({
  runs: state.runs,
  ball: state.ball,
});

export default connect(mapStateToProps)(HighestPartnership);

/*findIndex not to be used but keeping incase i need to use:
const indexOfWickets = runEvents.findIndex(x => x.wicketEvent === true);
console.log(indexOfWickets);
*/
