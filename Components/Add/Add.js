import React, { Component } from 'react';

import { Container, Footer, Text, Button, Icon } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio, Platform, Dimensions } from 'react-native';
import { connect } from "react-redux";

import Dot from '../Dot/Dot.js';
import RunPicker from '../RunPicker/RunPicker.js';
import Undo from '../Undo/Undo.js';

import { updateRuns } from '../../Reducers/runs';

/*
Native Base StyleSheet
*/
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
const styles = StyleSheet.create({
    rowContainer: {

        justifyContent: 'center',
        padding: 10,
    },
    rowContainerRuns: {

      justifyContent: 'center',
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
      bottom: PixelRatio.get() === 2 && Platform.OS === 'ios' && (height <= 568) ? 0 : PixelRatio.get() === 2 && Platform.OS === 'ios' ? 40 : 5,
    },
});

class Add extends Component {

  state = {
    runs: this.props.runs.runs || 0,
    runEvents: this.props.runs.runEvents || [],
    eventID: this.props.runs.eventID || 0,
    highestRunsPartnership: this.props.runs.highestRunsPartnership || []
  };

  handleChange = ( runs ) => {
    this.setState({ runs });
  };

addRuns = () => {

  let firstWicketIndex = this.props.runs.firstWicketIndex;
  let secondWicketIndex = this.props.runs.secondWicketIndex;
  let highestRunsPartnership =  this.props.runs.secondWicketIndex;

  let eventID = this.props.runs.eventID;
  let runs = this.props.runs.runs;
  console.log(runs);

  let runEvents = this.runs.runEvents;
  console.log(runEvents);

  let ballCount = BallCount.getBallCount(runs);
  let totalRuns = ballCount[0];

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

}

  render() {

    return (
        <Grid>
          <Row size={10} style={styles.rowPadding}>
            <Col size={1} style={styles.rowContainerRuns}>
              <Undo />
            </Col>
            <Col style={styles.rowContainer} size={1}>
            <Dot />
            </Col>
            <Col size={1} style={styles.rowContainerRuns} >
              <RunPicker />
            </Col>
          </Row>
        </Grid>
    );
  }
}

const mapStateToProps = state => ({
  runs: state.runs,
});

export default connect(mapStateToProps)(Add);
