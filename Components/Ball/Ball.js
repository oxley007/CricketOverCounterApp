import React, { Component } from 'react';
import { compose } from 'react-compose';

import { Container, Header, Content, Button, Text, Icon } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View} from 'react-native';

import { connect } from "react-redux";
import { updateOver } from '../../Reducers/over';
import { updateStopwatch } from '../../Reducers/stopwatch';

const styles = StyleSheet.create({
    rowContainer: {
        margin: 8,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    button: {
        marginHorizontal: 8,
        backgroundColor: '#777',
    },
    add: {
        backgroundColor: '#777',
        borderRadius: 50,
        width: 60,
        height: 60,
        fontSize: 40,
    },
    largeCircle: {
      height: 80,
      width: 80,
      backgroundColor: '#fff'
    },
    largeIcon: {
      fontSize: 65,
      color: '#c471ed',
      marginTop: 'auto',
      marginRight: 'auto',
      marginBottom: 'auto',
      marginLeft: 'auto',
    },
    largeOk: {
      fontSize: 20,
      color: '#c471ed',
      marginTop: 'auto',
      marginRight: 'auto',
      marginBottom: 'auto',
      marginLeft: 'auto',
    }
});


const formattedSeconds = (sec) =>
  Math.floor(sec / 60) +
    '.' +
  ('0' + sec % 60).slice(-2)

class Ball extends Component {

  state = {
    secondsElapsed: this.props.stopwatch.secondsElapsed || 0,
    laps: this.props.stopwatch.laps || [],
    lastClearedIncrementer: this.props.stopwatch.lastClearedIncrementer || null,
    incrementer: this.props.stopwatch.incrementer || null,
    avgBall: this.props.stopwatch.avgBall || [],
    avgSeconds: this.props.stopwatch.avgSeconds || 0,
    ball: this.props.ball.ball || 0,
    over: this.props.ball.over || 0,
  };

  handleChange = ( ball, stopwatch ) => {
    this.setState({ ball });
    this.setState({ stopwatch });
    //this.setState({ secondsElapsed });
  };

incrementer = () => {
  console.log(this.state.incrementer);
  let incrementer = null;
  console.log(incrementer);
  this.setState({incrementer: incrementer});
}

addBall = () => {

  console.log(this.props.stopwatch.secondsElapsed);
  //console.log(this.props.stopwatch.stopwatch);
  console.log(this.props.ball.over);
  console.log(this.props.ball.ball);
  let balls = this.props.ball.ball;
  let overs = this.props.ball.over;


  this.stopwatch();

  console.log(balls);
  if (balls <= 5) {
  balls++;
  }
  else if (balls === 6) {
    balls = 0;
    overs++;
  }

  this.setState({
    ball: balls,
    over: overs,
  }, function () {
    console.log(this.state.ball  + ' ball');
    console.log(this.state.over  + ' over');
    const { ball, over } = this.state
    this.props.dispatch(updateOver(this.state.ball, this.state.over));
  })


  /*
  ****ADD BACK IN ONCE WORCKET STORE CREATED:****
  console.log(this.props.wickets);

  if (this.props.wickets > 1) {
    this.props.averagePartnerhsip(this.props.wickets, balls, this.props.over)
}
*/

/*
*****ADD BACK IN ONCE HIGHEST PARNERSHIP STORE CREATED*****
let clickFrom = 'addBall';

this.props.highestPartnership(this.props.wickets, balls, this.props.over, null, clickFrom);
*/

}

stopwatch = () => {

  /*
  Work out the average seconds ecslipsed by adding to the array
  */
    let secondsElapsed = this.props.stopwatch.secondsElapsed;
    //let formattedAvgSeconds = formattedSeconds(secondsElapsed);
    //console.log(formattedAvgSeconds);
    let avgBalls = this.props.stopwatch.avgBall;
    console.log(this.props.stopwatch.avgBall);
    console.log(this.props.stopwatch.secondsElapsed);

    if (this.props.ball.ball >= 1 && this.props.ball.ball <= 5) {
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
          if (this.props.stopwatch.secondsElapsed >= 120) {
            this.handleStopClick();
          }
          else if (this.props.ball.ball === 6 || this.props.ball.ball === 0) {
            //don't do anything.
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

//ADD handleStopClick() back in here from orginal project...



  checkOverBowled() {
    if (this.props.ball.ball === 6) {
      return <Text style={styles.largeOk}>OK</Text>
      }
    else {
      return <Icon name='add' style={styles.largeIcon} />

      }
  }


  render() {
  const { classes } = this.props;
    return (
          <Button rounded large style={styles.largeCircle} light onPress={this.addBall} title="Click me">
            {this.checkOverBowled()}
          </Button>


    );
  }
}

const mapStateToProps = state => ({
  stopwatch: state.stopwatch,
  ball: state.ball,
  stopwatch: state.stopwatch,
});

export default connect(mapStateToProps)(Ball);
