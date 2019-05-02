import React, { Component } from 'react';

import { Container, Footer, Text, Button, Icon, H3, H1 } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio, Platform, Dimensions } from 'react-native';
import { connect } from "react-redux";

import { updateRuns } from '../../Reducers/runs';
import { updateOver } from '../../Reducers/over';

import BallDiff from '../../Util/BallDiff.js';

// Custom Styles
//const dimen = Dimensions.get('window');
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
const styles = StyleSheet.create({
  textHeader: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '300',
    fontSize: PixelRatio.get() === 1 ? 16 : PixelRatio.get() === 1.5 ? 18 : PixelRatio.get() === 2 && (width < 414) ? 22 : PixelRatio.get() === 2 && (width === 414) ? 24 : PixelRatio.get() === 3.5 ? 24 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 20 : PixelRatio.get() === 3 && (width === 414) && Platform.OS === 'ios' ? 24 : 22,
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
    fontSize: PixelRatio.get() === 1 ? 24 : PixelRatio.get() === 1.5 ? 30 : PixelRatio.get() === 2 ? 35 : 40,
    color: '#fff',
    lineHeight: PixelRatio.get() === 1 ? 24 : PixelRatio.get() === 1.5 ? 30 : PixelRatio.get() === 2 ? 35 : 40,
  },
});

class AveragePartnership extends Component {

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

  averageRunsPartnership() {

    let runEvents = this.props.runs.runEvents;

    //Calculate total woickets.
    const countWickets = runEvents.filter(wickets => wickets.wicketEvent === true);
    const totalWickets = countWickets.length;
    console.log(totalWickets);

    let sum = a => a.reduce((acc, item) => acc + item);
    let totalBatRuns = sum(runEvents.map(acc => Number(acc.runsValue)));
    console.log(totalBatRuns);
    let totalExtraRuns = sum(runEvents.map(acc => Number(acc.runExtras)));
    console.log(totalExtraRuns);
    let totalRuns = totalBatRuns + totalExtraRuns;
    console.log(totalRuns);

    let averageRunsPartnership = totalRuns / totalWickets;
    console.log(averageRunsPartnership);

    if (averageRunsPartnership === Infinity || averageRunsPartnership === undefined || isNaN(averageRunsPartnership) ) {
        return (<H1 style={styles.currentPartnershipNumber}>~</H1>)
    }
    else {
      let averageRunsPartnershipOneDecimal = parseFloat(averageRunsPartnership).toFixed(1);
      return (<H1 style={styles.currentPartnershipNumber}>{averageRunsPartnershipOneDecimal}</H1>)
    }
  }

  render() {

    return (
        <Col>
          <Row>
            <Col style={styles.colCenter}>
              <Row>
                <H3 style={styles.textHeader}>Average Partnership</H3>
              </Row>
              <Row>
                <Text style={styles.currentPartnershipNumber}>
                  {this.averageRunsPartnership()}
                </Text>
              </Row>
              <Row>
                <Text style={styles.textDesc}>runs</Text>
              </Row>
            </Col>
          <View style={styles.verticleRule} />
        </Row>
      </Col>
    );
  }
}

const mapStateToProps = state => ({
  runs: state.runs,
  ball: state.ball,
});

export default connect(mapStateToProps)(AveragePartnership);

/*findIndex not to be used but keeping incase i need to use:
const indexOfWickets = runEvents.findIndex(x => x.wicketEvent === true);
console.log(indexOfWickets);
*/
