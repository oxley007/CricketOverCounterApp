import React, { Component } from "react";
import { Container, Header, Content, Icon, Picker, Form, Row, Col, Grid, Text } from "native-base";
import { StyleSheet, PixelRatio, Platform, Dimensions } from 'react-native';
import { connect } from "react-redux";

import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import BallDiff from '../../Util/BallDiff.js';

import { updateStopwatch } from '../../Reducers/stopwatch';
import { updateRuns } from '../../Reducers/runs';
import { updateOver } from '../../Reducers/over';
import { updateStoptimer } from '../../Reducers/stoptimer';

const formattedSeconds = (sec) =>
  Math.floor(sec / 60) +
    '.' +
  ('0' + sec % 60).slice(-2)

class RunPicker extends Component {

  state = {
    runs: this.props.runs.runs || 0,
    runEvents: this.props.runs.runEvents || [{eventID: 0, runsValue: 0, ball: -1, wicketEvent: false, runExtras: 0, runsType: 'deleted'}],
    eventID: this.props.runs.eventID || 0,
    firstWicketIndex: this.props.runs.firstWicketIndex || 0,
    secondWicketIndex: this.props.runs.secondWicketIndex || 0,
    highestRunsPartnership: this.props.runs.highestRunsPartnership || [],
    ball: this.props.ball.ball || 0,
    over: this.props.ball.over || 0,
    selected: undefined,
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
            else if (totalBall === 0 || runEventsLast.runsType.includes('WICKET')) {
              //don't do anything.
            }
            else if ( this.props.stoptimer.stoptimer === true ) {
              //const { secondsElapsed, laps, lastClearedIncrementer, incrementer, avgBall, avgSeconds } = this.state;
              //this.props.dispatch(updateStopwatch( this.state.secondsElapsed, this.state.laps, this.state.lastClearedIncrementer, this.state.incrementer, this.state.avgBall, this.state.avgSeconds ));
              //this.handleStopClickTwo(avgBalls, avgSeconds);
              this.handleStopClick();
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

  onValueChange(value) {

    let firstWicketIndex = this.props.runs.firstWicketIndex;
    let secondWicketIndex = this.props.runs.secondWicketIndex;
    let highestRunsPartnership = this.props.runs.highestRunsPartnership;

    console.log(value);

    let runsValue = value.split(' ')[0];

    console.log(runsValue);

    let runsType = value.split(' ')[1];

    console.log(runsType);

    let runExtras = 0;

    if ((runsType === 'NO-BALL') || (runsType ===  'WIDE') || (runsType ===  'BYE') || (runsType ===  'LEG-BYE')) {
      console.log('tunType hit for wide, no-ball, bye, leg bye');
      runExtras = runsValue;
      console.log(runExtras);
      runsValue = 0;
      console.log(runsValue);
    }
    else if (runsType.includes('NO-BALL' || 'WIDE' || 'BYE' || 'LEG-BYE')) {
      runsValue = 1;
      runsValue--;
      runExtras = runsValue;
    }

    let wicketEvent = false;

    if (runsType.includes('WICKET')) {
      wicketEvent = true;
    }

    console.log(wicketEvent);

    let eventID = this.props.runs.eventID;

    eventID++

    this.setState({
      selected: "runs"
    });

    let runEvents = this.props.runs.runEvents;
    console.log(runEvents);

    let over = this.props.ball.over;
    //let ball = this.props.ball.ball;

    //(runEvents.map(acc => Number(acc.runsValue)));
    console.log(ball);
    let ball = runEvents.map(acc => {
      console.log(acc);
    if (acc.runsType.includes('NO-BALL' || 'WIDE')) {
      //dont add a ball
    }
    else {
      ball++
    }
  });
    console.log(ball);

    runEvents.push({eventID: eventID, runsValue: runsValue, ball: ball, wicketEvent: wicketEvent, runExtras: runExtras, runsType: runsType});
    console.log(runEvents);

    let totalRuns = this.props.runs.runs;

    /*
    //check to see if run stopwatch or stop stopwatch.
    let lastEventNumber = runEvents.length-1;
    console.log(lastEventNumber);
    let runEventsLast = runEvents[lastEventNumber];
    console.log(runEventsLast);
        if (runEventsLast.runsValue != 0 || runEventsLast.runExtras != 0 ) {
          console.log('runEvent.runsValue != 0 || runEvent.runExtras != 0');
          this.handleStopClick();
          this.stopwatch();
        }
        else {
          console.log('not starting stopwatch' + runEventsLast.runsValue + ' ' + runEventsLast.runExtras);
        }
        */

        let stoptimer = false;

        this.setState({
          stoptimer: stoptimer,
        }, function () {
          const { stoptimer } = this.state
          this.props.dispatch(updateStoptimer(this.state.stoptimer));
        })

          this.stopwatch();

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
      <Row size={10} style={styles.rowPadding}>
        <Col style={styles.rowContainer} size={2}>
      <Container style={styles.container}>
        <Content>

          <Form>


            <Picker
              placeholder="Runs"
              placeholder={<Text>&nbsp;<Icon name='add' style={styles.plaeholder} /></Text>}
              textStyle={styles.textStyle}
              itemStyle={{
                backgroundColor: "#12c2e9",
                marginLeft: 0,
                paddingLeft: 30,
                borderBottomColor: '#fff'
              }}
              itemTextStyle={{ color: '#fff', fontWeight: 'bold' }}
              style={{ width: 130 }}
              selectedValue={this.state.selected}
              onValueChange={this.onValueChange.bind(this)}
            >



            <Picker.Item label="+2 WIDES" value="2 WIDES" style={{ backgroundColor: '#12c2e9', color: '#ffffff', textAlign: 'center' }} />
            <Picker.Item label="+2 BYES" value="2 BYES" style={styles.blue_center} />
            <Picker.Item label="+2 LEG-BYES" value="2 LEG-BYE" style={styles.blue_center} />
              <Picker.Item label="+1 WIDE" value="1 WIDE" style={styles.blue_center} />
              <Picker.Item label="+1 NO-BALL" value="1 NO-BALL" style={styles.blue_center} />
              <Picker.Item label="+1 BYE" value="1 BYE" style={styles.blue_center} />
              <Picker.Item label="+1 LEG-BYE" value="1 LEG-BYE" style={styles.blue_center} />

              <Picker.Item label="+6 RUNS" value="6 RUNS" style={styles.purple_center} />
              <Picker.Item label="+5 RUNS" value="5 RUNS" style={styles.purple_center} />
                <Picker.Item label="+4 RUNS" value="4 RUNS" style={styles.purple_center} />
                <Picker.Item label="+3 RUNS" value="3 RUNS" style={styles.purple_center}  />
                <Picker.Item label="+2 RUNS" value="2 RUNS" style={styles.purple_center} />
                <Picker.Item label="+1 RUN" value="1 RUNS" style={styles.purple_center} />

                <Picker.Item label="WICKET" value="0 WICKETS" />
                <Picker.Item label="WICKET + 1 RUN" value="1 WICKET" />
                <Picker.Item label="WICKET + 2 RUNS" value="2 WICKET" />

                <Picker.Item label="+3 WIDES" value="3 WIDES" />
                <Picker.Item label="+3 BYES" value="3 BYES" />
                <Picker.Item label="+3 LEG-BYES" value="3 LEG-BYE" style={styles.blue_center} />
                <Picker.Item label="WICKET + 3 RUNS" value="3 WICKET" />

                <Picker.Item label="4 WIDES" value="4 WIDES" />
                <Picker.Item label="4 NO-BALLS" value="4 NO-BALLS" />
                <Picker.Item label="4 BYES" value="4 BYES" />
                <Picker.Item label="+4 LEG-BYES" value="4 LEG-BYE" style={styles.blue_center} />
                <Picker.Item label="WICKET + 4 RUNS" value="4 WICKET" />

                <Picker.Item label="5 WIDES" value="5 WIDES" />
                <Picker.Item label="5 BYES" value="5 BYES" />
                <Picker.Item label="+5 LEG-BYES" value="5 LEG-BYE" style={styles.blue_center} />
                <Picker.Item label="5 NO-BALLS" value="5 NO-BALLS" />
                <Picker.Item label="WICKET + 5 RUNS" value="5 WICKET" />

                <Picker.Item label="WICKET + 1 WIDE" value="1 WICKET-WIDE" />
                <Picker.Item label="WICKET + 1 NO-BALL" value="1 WICKET-NO-BALL" />
                <Picker.Item label="+1 NO-BALLS AND 1 RUN" value="2 NO-BALLS" color="#12c2e9" />
                <Picker.Item label="WICKET + 1 BYE" value="1 WICKLET-BYE" />
                <Picker.Item label="WICKET -1 (minus) RUNS" value="1 WICKET-MINUS" />
                <Picker.Item label="-1 (minus) RUNS" value="1 MINUS" />

                <Picker.Item label="WICKET + 2 WIDES" value="2 WICKET-WIDE" />
                <Picker.Item label="WICKET + 2 NO-BALLS" value="2 WICKET-NO-BALL" />
                <Picker.Item label="+1 NO-BALLS AND 2 RUNS" value="3 NO-BALLS" color="#12c2e9" />
                <Picker.Item label="WICKET + 2 BYE" value="2 WICKET-BYE" />
                <Picker.Item label="WICKET -2 (minus) RUNS" value="2 WICKET-MINUS" />
                <Picker.Item label="-2 (minus) RUNS" value="2 MINUS" />

                <Picker.Item label="WICKET + 3 WIDE" value="3 WICKET-WIDE" />
                <Picker.Item label="WICKET + 3 NO-BALL" value="3 WICKET-NO-BALL" />
                <Picker.Item label="+1 NO-BALLS AND 3 RUNS" value="4 NO-BALLS" color="#12c2e9" />
                <Picker.Item label="WICKET + 3 BYE" value="3 WICKLET-BYE" />
                <Picker.Item label="WICKET -3 (minus) RUNS" value="3 WICKET-MINUS" />
                <Picker.Item label="-3 (minus) RUNS" value="3 MINUS" />

                <Picker.Item label="WICKET + 4 WIDE" value="4 WICKET-WIDE" />
                <Picker.Item label="WICKET + 4 NO-BALL" value="4 WICKET-NO-BALL" />
                <Picker.Item label="+1 NO-BALLS AND 4 RUNS" value="5 NO-BALLS" color="#12c2e9" />
                <Picker.Item label="WICKET + 4 BYES" value="4 WICKET-BYE" />
                <Picker.Item label="+4 LEG-BYES" value="4 LEG-BYE" style={styles.blue_center} />
                <Picker.Item label="WICKET -4 (minus) RUNS" value="4 WICKET-MINUS" />
                <Picker.Item label="-4 (minus) RUNS" value="4 MINUS" />

                <Picker.Item label="WICKET + 5 WIDE" value="5 WICKET-WIDE" />
                <Picker.Item label="WICKET + 5 NO-BALL" value="5 WICKET-NO-BALL" />
                <Picker.Item label="+1 NO-BALLS AND 5 RUNS" value="6 NO-BALLS" color="#12c2e9" />
                <Picker.Item label="WICKET + 5 BYES" value="5 WICKET-BYE" />
                <Picker.Item label="+5 LEG-BYES" value="5 LEG-BYE" style={styles.blue_center} />
                <Picker.Item label="WICKET -5 (minus) RUNS" value="5 WICKET-MINUS" />
                <Picker.Item label="-5 (minus) RUNS" value="5 MINUS" />

                <Picker.Item label="6 WIDES" value="6 WIDES" />
                <Picker.Item label="6 BYES" value="6 BYES" />
                <Picker.Item label="+6 LEG-BYES" value="6 LEG-BYE" style={styles.blue_center} />
                <Picker.Item label="6 NO-BALLS" value="6 NO-BALLS" />
                <Picker.Item label="+1 NO-BALLS AND 6 RUNS" value="7 NO-BALLS" color="#12c2e9" />
                <Picker.Item label="WICKET + 6 RUNS" value="6 WICKET" />
                <Picker.Item label="WICKET + 6 WIDE" value="6 WICKET-WIDE" />
                <Picker.Item label="WICKET + 6 NO-BALL" value="6 WICKET-NO-BALL" />
                <Picker.Item label="WICKET + 6 BYE" value="6 WICKLET-BYE" />
                <Picker.Item label="WICKET -6 (minus) RUNS" value="6 WICKET-MINUS" />
                <Picker.Item label="-6 (minus) RUNS" value="6 MINUS" />

                <Picker.Item label="WICKET + 1 NO-BALLS AND 1 RUN" value="2 WICKET-NO-BALL" />
                <Picker.Item label="WICKET + 1 NO-BALLS AND 2 RUNS" value="3 WICKET-NO-BALL" />
                <Picker.Item label="WICKET + 1 NO-BALLS AND 3 RUNS" value="4 WICKET-NO-BALL" />
                <Picker.Item label="WICKET + 1 NO-BALLS AND 4 RUNS" value="5 WICKET-NO-BALL" />
                <Picker.Item label="WICKET + 1 NO-BALLS AND 5 RUNS" value="6 WICKET-NO-BALL" />
                <Picker.Item label="WICKET + 1 NO-BALLS AND 6 RUNS" value="7 WICKET-NO-BALL" />

                <Picker.Item label="7 WIDES" value="7 WIDES" />
                <Picker.Item label="7 BYES" value="7 BYES" />
                <Picker.Item label="+7 LEG-BYES" value="7 LEG-BYE" style={styles.blue_center} />
                <Picker.Item label="7 NO-BALLS" value="7 NO-BALLS" />
                <Picker.Item label="7 RUNS" value="7 RUNS" />
                <Picker.Item label="WICKET + 7 RUNS" value="7 WICKET" />
                <Picker.Item label="WICKET + 7 WIDE" value="7 WICKET-WIDE" />
                <Picker.Item label="WICKET + 7 NO-BALL" value="7 WICKET-NO-BALL" />
                <Picker.Item label="WICKET + 7 BYE" value="7 WICKLET-BYE" />
                <Picker.Item label="WICKET -7 (minus) RUNS" value="7 WICKET-MINUS" />
                <Picker.Item label="-7 (minus) RUNS" value="7 MINUS" />

                <Picker.Item label="8 WIDES" value="8 WIDES" />
                <Picker.Item label="8 BYES" value="8 BYES" />
                <Picker.Item label="+8 LEG-BYES" value="8 LEG-BYE" style={styles.blue_center} />
                <Picker.Item label="8 NO-BALLS" value="8 NO-BALLS" />
                <Picker.Item label="8 RUNS" value="8 RUNS" />
                <Picker.Item label="WICKET + 8 RUNS" value="8 WICKET" />
                <Picker.Item label="WICKET + 8 WIDE" value="8 WICKET-WIDE" />
                <Picker.Item label="WICKET + 8 NO-BALL" value="8 WICKET-NO-BALL" />
                <Picker.Item label="WICKET + 8 BYE" value="8 WICKLET-BYE" />
                <Picker.Item label="WICKET -8 (minus) RUNS" value="8 WICKET-MINUS" />
                <Picker.Item label="-8 (minus) RUNS" value="8 MINUS" />

                <Picker.Item label="9 WIDES" value="9-WIDES" />
                <Picker.Item label="9 BYES" value="9 BYES" />
                <Picker.Item label="+9 LEG-BYES" value="9 LEG-BYE" style={styles.blue_center} />
                <Picker.Item label="9 NO-BALLS" value="9 NO-BALLS" />
                <Picker.Item label="9 RUNS" value="9 RUNS" />
                <Picker.Item label="WICKET + 9 RUNS" value="9 WICKET" />
                <Picker.Item label="WICKET + 9 WIDE" value="9 WICKET-WIDE" />
                <Picker.Item label="WICKET + 9 NO-BALL" value="9 WICKET-NO-BALL" />
                <Picker.Item label="WICKET + 9 BYE" value="9 WICKLET-BYE" />
                <Picker.Item label="WICKET -9 (minus) RUNS" value="9 WICKET-MINUS" />
                <Picker.Item label="-9 (minus) RUNS" value="9 MINUS" />

                <Picker.Item label="10 WIDES" value="10 WIDES" />
                <Picker.Item label="10 BYES" value="10 BYES" />
                <Picker.Item label="+10 LEG-BYES" value="10 LEG-BYE" style={styles.blue_center} />
                <Picker.Item label="10 NO-BALLS" value="10 NO-BALLS" />
                <Picker.Item label="10 RUNS" value="10 RUNS" />
                <Picker.Item label="WICKET + 10 RUNS" value="10 WICKET" />
                <Picker.Item label="WICKET + 10 WIDE" value="10 WICKET-WIDE" />
                <Picker.Item label="WICKET + 10 NO-BALL" value="10 WICKET-NO-BALL" />
                <Picker.Item label="WICKET + 10 BYE" value="10 WICKLET-BYE" />
                <Picker.Item label="WICKET -10 (minus) RUNS" value="10 WICKET-MINUS" />
                <Picker.Item label="-10 (minus) RUNS" value="10 MINUS" />

                <Picker.Item label="-11 (minus) RUNS" value="11 MINUS" />
                <Picker.Item label="-12 (minus) RUNS" value="12 MINUS" />
                <Picker.Item label="-13 (minus) RUNS" value="13 MINUS" />
                <Picker.Item label="-14 (minus) RUNS" value="14 MINUS" />
                <Picker.Item label="-15 (minus) RUNS" value="15 MINUS" />
                <Picker.Item label="-16 (minus) RUNS" value="16 MINUS" />
                <Picker.Item label="-17 (minus) RUNS" value="17 MINUS" />
                <Picker.Item label="-18 (minus) RUNS" value="18 MINUS" />
                <Picker.Item label="-19 (minus) RUNS" value="19 MINUS" />
                <Picker.Item label="-20 (minus) RUNS" value="20 MINUS" />

              </Picker>

          </Form>

        </Content>
      </Container >
      </Col>
      </Row>
    );
  }
}

const mapStateToProps = state => ({
  runs: state.runs,
  ball: state.ball,
  stopwatch: state.stopwatch,
  stoptimer: state.stoptimer,
});

export default connect(mapStateToProps)(RunPicker);

// Custom Styles
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
const styles = StyleSheet.create({
  container: {
      flex: 0.5,
    alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 50,
      height: PixelRatio.get() === 2 ? 120 : 50,
      width: PixelRatio.get() === 2 ? 80 : PixelRatio.get() === 3 && (width >= 414) ? 80 : 90,
  },
  rowPadding: {
    bottom: PixelRatio.get() === 2 && Platform.OS === 'ios' ? 45 : PixelRatio.get() === 3 && (width >= 414) ? -10 : 15,
  },
  rowContainer: {
      justifyContent: 'center',
  },
  textStyle: {
    backgroundColor: "transparent",
    borderRadius: 50,
    height: PixelRatio.get() === 2 ? 160 : 130,
    justifyContent: 'center',
    marginTop: PixelRatio.get() === 2 ? '30%' : '25%',
},
plaeholder: {
  fontSize: PixelRatio.get() === 2 ? 80 : PixelRatio.get() === 3 && (width >= 414) ? 75 : 100,
  color: '#c471ed',
  justifyContent: 'center',
  marginRight: PixelRatio.get() === 2 ? 150 : 200,
},
});
