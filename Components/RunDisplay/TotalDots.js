import React, { Component } from 'react';

import { Container, Footer, Text, Button, Icon, H1 } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio, Platform, Dimensions } from 'react-native';
import { connect } from "react-redux";

import { updateRuns } from '../../Reducers/runs';
import { updateOver } from '../../Reducers/over';


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
    textHeader: {
      color: '#fff',
      fontWeight: '300',
      fontSize: PixelRatio.get() === 1 ? 16 : PixelRatio.get() === 1.5 ? 20 : PixelRatio.get() === 2 && (width < 414) ? 22 : PixelRatio.get() === 2 && (width === 414) ? 24 : PixelRatio.get() === 3.5 ? 24 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 20 : 24,
      },
      textDesc: {
        color: '#eee',
        fontWeight: '100',
        fontSize: PixelRatio.get() === 1 ? 10 : PixelRatio.get() === 1.5 ? 12 : PixelRatio.get() === 2 && (width < 414) ? 14 : PixelRatio.get() === 2 && (width === 414) ? 16 : PixelRatio.get() === 3.5 ? 14 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 14 : 16,
      },
      rowPadding :{
        paddingTop: 15,
      },
      colCenter: {
        alignItems: 'center',
      },
      textHeaderNumber: {
        color: '#fff',
        fontSize: PixelRatio.get() === 1 ? 28 : PixelRatio.get() === 1.5 ? 32 : PixelRatio.get() === 2 && (width < 414) ? 34 : PixelRatio.get() === 2 && (width === 414) ? 40 : PixelRatio.get() === 3.5 ? 38 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 34 : 40,
        lineHeight: 40,
      },
      horizontalRule: {
        borderBottomColor: '#fff',
        borderBottomWidth: 1,
        width: '100%',
        marginTop: 15,
        marginBottom: 15,
      },
      horizontalRuleTop: {
        borderBottomColor: '#fff',
        borderBottomWidth: 1,
        width: '100%',
        marginBottom: 15,
      },
});

class TotalDots extends Component {

  state = {
    runs: this.props.runs.runs || 0,
    runEvents: this.props.runs.runEvents || [],
    eventID: this.props.runs.eventID || 0,
    firstWicketIndex: this.props.runs.firstWicketIndex || 0,
    secondWicketIndex: this.props.runs.secondWicketIndex || 0,
    highestRunsPartnership: this.props.runs.highestRunsPartnership || [],
    ball: this.props.ball.ball || 0,
    over: this.props.ball.over || 0,
    toggle: this.props.toggle.togglePremium || false,
  };

  handleChange = ( runs, ball ) => {
    this.setState({ runs });
    this.setState({ ball });
    this.setState({ partnership });
  };

  DotsDsiplay() {
    let runEvents = this.props.runs.runEvents;

    let sum = a => a.reduce((acc, item) => acc + item);

  let totalDots = 0;
  const countDotsTotal = runEvents.map(acc => {
    console.log(acc);
  if (acc.runsType.includes('NO-BALL') || acc.runsType.includes('WIDE') || acc.runsType.includes('LEG-BYE') || acc.runsType.includes('BYE'))  {
    console.log('Hit as an extra');
    return totalDots = 0;
    //dont add a ball
  }
  else if (acc.runsType === 'deleted') {
    //ignore.
    console.log('hit as a deleted ball');
    return totalDots = 0;
  }
  else if (acc.runsType.includes('dot')) {
    console.log(totalDots + 'hit as a legit dot-ball');
    return totalDots = 1;
    console.log(totalDots);
  }
  else {
    console.log('hit as a run ball');
    return totalDots = 0;
  }
});
  console.log(countDotsTotal);
  totalDots = sum(countDotsTotal.map(acc => Number(acc)));
  console.log(totalDots);

    if (totalDots === 0) {
      //totalDotsFirst = 0;
    return (
      <H1 style={styles.textHeaderNumber}>0</H1>
      )
      }
  else {
    return (
          <H1 style={styles.textHeaderNumber}>{totalDots}</H1>
  )
  }
  }

  render() {

    return (
        <Grid style={styles.rowPadding}>
        <View style={styles.horizontalRuleTop} />
        <Row>
          <Col size={9}>
            <Row><H1 style={styles.textHeader}>Total Dots:</H1></Row>
            <Row><Text style={styles.textDesc}>Total dot balls for the innings</Text></Row>
          </Col>
          <Col size={3} style={styles.colCenter}>
            <Row>
          {this.DotsDsiplay()}
          </Row>
          <Row>
            <Text style={styles.textDesc}>Dots</Text>
          </Row>
        </Col>
      </Row>
      <View style={styles.horizontalRule} />
        </Grid>
    );
  }
}

const mapStateToProps = state => ({
  runs: state.runs,
  ball: state.ball,
  toggle: state.toggle,
});

export default connect(mapStateToProps)(TotalDots);

/*findIndex not to be used but keeping incase i need to use:
const indexOfWickets = runEvents.findIndex(x => x.wicketEvent === true);
console.log(indexOfWickets);
*/
