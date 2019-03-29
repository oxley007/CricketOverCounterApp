import React, { Component } from 'react';
import { compose } from 'react-compose';

import BallDiff from '../../Util/BallDiff.js';
import BallCalc from '../../Util/BallCalc.js';

import { Container, Header, Content, Button, Text, Icon } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, Vibration, PixelRatio, Platform} from 'react-native';

import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

import { connect } from "react-redux";
import { updateOver } from '../../Reducers/over';
import { updateStopwatch } from '../../Reducers/stopwatch';
import { updatePartnership } from '../../Reducers/partnership';
import { updatePartnerships } from '../../Reducers/partnerships';
import { updateWicket } from '../../Reducers/wicket';
import { updateWicketBall } from '../../Reducers/wicketball';
import { updateReset } from '../../Reducers/reset';


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
        width: PixelRatio.get() === 1 ? 50 : PixelRatio.get() === 1.5 ? 50 : PixelRatio.get() === 2 ? 50 : PixelRatio.get() === 3.5 ? 60 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 50 : 60,
        height: PixelRatio.get() === 1 ? 50 : PixelRatio.get() === 1.5 ? 50 : PixelRatio.get() === 2 ? 50 : PixelRatio.get() === 3.5 ? 60 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 50 : 60,
        fontSize: 40,
        //paddingBottom: 10,
    },
    largeCircle: {

      height: PixelRatio.get() === 1 ? 50 : PixelRatio.get() === 1.5 ? 60 : PixelRatio.get() === 2 ? 70 : PixelRatio.get() === 3.5 ? 70 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 60 : 80,
      width: PixelRatio.get() === 1 ? 50 : PixelRatio.get() === 1.5 ? 60 : PixelRatio.get() === 2 ? 70 : PixelRatio.get() === 3.5 ? 70 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 60 : 80,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    largeIcon: {
      fontSize: PixelRatio.get() === 1 ? 40 : PixelRatio.get() === 1.5 ? 50 : PixelRatio.get() === 2 ? 55 : PixelRatio.get() === 3.5 ? 65 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 55 : 65,
      color: '#c471ed',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    largeOk: {
      fontSize: 20,
      color: '#c471ed',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 'auto',
      marginRight: 'auto',
    }
});


const formattedSeconds = (sec) =>
  Math.floor(sec / 60) +
    '.' +
  ('0' + sec % 60).slice(-2)


//Constants for vibration.
const DURATION = 500 ;
const PATTERN = [ 500, 1000] ;


class Ball extends Component {

  state = {
    wicket: this.props.wicket.wicket || 0,
    wicketBalls: this.props.wicket.wicketBalls || [],
    secondsElapsed: this.props.stopwatch.secondsElapsed || 0,
    laps: this.props.stopwatch.laps || [],
    lastClearedIncrementer: this.props.stopwatch.lastClearedIncrementer || null,
    incrementer: this.props.stopwatch.incrementer || null,
    avgBall: this.props.stopwatch.avgBall || [],
    avgSeconds: this.props.stopwatch.avgSeconds || 0,
    ball: this.props.ball.ball || 0,
    over: this.props.ball.over || 0,
    highestPartnership: this.props.partnership.highestPartnership || 0,
    partnerships: this.props.partnerships.partnerships || [],
    currentPartnership: this.props.partnership.currentPartnership || 0,
    avgWicket: this.props.partnership.avgWicket || 0,
    wicketBall: this.props.wicketBall.wicketBall || false,
    reset: this.props.reset.reset || 0,
  };

  handleChange = ( ball, stopwatch, partnership, partnerships, wicket, wicketBall ) => {
    this.setState({ ball });
    this.setState({ stopwatch });
    this.setState({ partnership });
    this.setState({ partnerships });
    this.setState({ wicket });
    this.setState({ wicketBall });
    this.setState({ reset });
  };

incrementer = () => {
  console.log(this.state.incrementer);
  let incrementer = null;
  console.log(incrementer);
  this.setState({incrementer: incrementer});
}

addBall = () => {

  // Device Will Vibrate for 0.5 seconds.
    //Vibration.vibrate(DURATION) ;

  ReactNativeHapticFeedback.trigger('impactLight', true);

  let resetDisplay = 0;
  this.setState({reset: resetDisplay}
    , function () {
      console.log(this.props.reset.reset  + ' reset');
      const { resetDisplay } = this.state
      this.props.dispatch(updateReset(this.state.reset))
    });

  let balls = this.props.ball.ball;
  let overs = this.props.ball.over;
  let wicketBall = `${overs}.${balls}`;


  this.stopwatch();

  let wicketBallFlag = false;
  this.setState({
    wicketBall: wicketBallFlag,
  }, function () {
    //console.log(this.state.over  + ' over');
    const { wicketBall } = this.state
    this.props.dispatch(updateWicketBall(this.state.wicketBall));
  })

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

  //call average partnership

  if (this.props.wicket.wicket >= 2) {
    let avgPartGet = this.averagePartnerhsip(this.props.wicket.wicket, balls, overs);
    console.log(avgPartGet);
    let angWicketGet = avgPartGet[0];
    console.log(angWicketGet);
    //console.log(this.props.partnership.avgWicket);
    this.setState({
      avgWicket: angWicketGet,
    }, function () {
      console.log(this.props.partnership.avgWicket  + ' avgWicket');
      const { avgWicket } = this.state
      this.props.dispatch(updatePartnership( this.state.avgWicket ));
    });
  }
  else if (this.props.wicket.wicket === 1) {
    console.log(this.props.partnerships.partnerships[0]);
    const avgWicket = this.props.partnerships.partnerships[0];
    //let avgWicketDiff = BallDiff.getOverAndBallSeperation(avgWicket);
    //let avgWicketOver = avgWicketDiff[0];
    //console.log(avgWicketOver);
    //let avgWicketBall = avgWicketDiff[1];
    //console.log(avgWicketBall);

    //let avgWicketCurrentBallOver = `${avgWicketOver}.${avgWicketBall}`;
    //console.log(avgWicketCurrentBallOver);

    this.setState({
      avgWicket: avgWicket,
    }, function () {
      console.log(this.props.partnership.avgWicket  + ' avgWicket');
      const { avgWicket } = this.state
      this.props.dispatch(updatePartnership( this.state.avgWicket ));
    });
  }
  else {
    console.log('hit when ball = 0?');
    const avgWicket = 0.0;
    this.setState({
      avgWicket: avgWicket,
    }, function () {
      console.log(this.props.partnership.avgWicket  + ' avgWicket');
      const { avgWicket } = this.state
      this.props.dispatch(updatePartnership( this.state.avgWicket ));
    });
  }

console.log(this.props.ball.ball);
console.log(this.props.wicket.wicket);

  //call highest partnership
  if (this.props.ball.ball < 6) {
    console.log('hit highesrt partnership less than 6 balls');
  let clickFrom = 'addBall';

  this.highestPartnership(this.props.wicket.wicket, balls, overs, null, clickFrom);
}
else if (this.props.ball.ball === 6 && this.props.wicket.wicket <= 0 ) {
  console.log('is this hit for latest partnerhsip when wicket 0 and ball 6');
  const latestPartnership = `${this.props.ball.over}.${this.props.ball.ball}`
  this.setState({
    currentPartnership: latestPartnership,
  }, function () {
    console.log(this.props.partnership.partnerships  + ' partnerships');
    const { highestPartnership, currentPartnership } = this.state
    this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.currentPartnership, this.state.avgWicket ));
  });
}
else {
  console.log(this.props.partnership.currentPartnership);
  const latestPartnership = this.props.partnership.currentPartnership
  this.setState({
    currentPartnership: latestPartnership,
  }, function () {
    console.log(this.props.partnership.partnerships  + ' partnerships');
    const { highestPartnership, currentPartnership } = this.state
    this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.currentPartnership, this.state.avgWicket ));
  });
}



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
          console.log(this.props.wicketBall.wicketBall);
          if (this.props.stopwatch.secondsElapsed >= 120 ) {
            this.handleStopClick();
          }
          else if (this.props.ball.ball === 6 || this.props.ball.ball === 0 || this.props.wicketBall.wicketBall === true ) {
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


  /*
  Highest partnership calculations
  */

  highestPartnership = (wickets, ball, over, wicketBall, clickFrom) => {

    console.log('hit hightestPartnership');
    console.log(wickets);
    console.log(ball);
    console.log(over);
    console.log(wicketBall);
    console.log(clickFrom);
    //workout the balls between each wicket
    //the first wicket is just the over so far
    let highestPartnership;
    let latestPartnership;
    let partnershipBall;
    let partnershipOver;

    //let partnerships = this.props.partnership.partnerships.slice();
    let partnerships = this.props.partnership.partnerships;
    console.log(partnerships);

    let wicketBalls = this.props.wicket.wicketBalls;

    if (wickets === 1 && clickFrom === 'wicket') {
      console.log('hit if wickets 1 and click form wicket.');
      highestPartnership = wicketBall;
      latestPartnership = wicketBall;
    }
    else if (wickets > 1 || (wickets >= 1 && clickFrom === 'addBall')) {
      console.log(latestPartnership + ' about to be hit');
      //the second wicket and more needs to take the current over minus the previous wicket over
      latestPartnership = BallCalc.getOverDiff(wicketBalls, partnershipOver, over, ball, partnershipBall);
      console.log(latestPartnership);
    }
    else {
      const ballOver = `${over}.${ball}`;
      latestPartnership = ballOver;
      console.log(latestPartnership);
    }




    if (clickFrom === 'wicket') {

      console.log('hit clickFrom = wicket');
      console.log(latestPartnership);
    // we then store this into an array partershipTotals
      partnerships.push(latestPartnership);
      console.log(partnerships);

      this.setState({
        partnerships: partnerships,
      }, function () {
        console.log(this.props.partnerships.partnerships  + ' partnerships');
        const { partnerships } = this.state
        this.props.dispatch(updatePartnerships(this.state.partnerships ));
      });


      //then use max to find highest partenership and store in state.
      let highPartnership = Math.max.apply(null, partnerships);

      // get the highest partnership and strip into sperate overs and ball variables.
      let highestPartnershipDiff = BallDiff.getOverAndBallSeperation(highPartnership);
      let highPartnersipOver = highestPartnershipDiff[0];

      let highPartnersipBall = highestPartnershipDiff[1];

      if (highPartnersipBall === 6) {
        highPartnership = highPartnersipOver + 1;
    }
    console.log(highPartnership);

    this.setState({
      highestPartnership: highPartnership,
    }, function () {
      console.log(this.props.partnership.highestPartnership  + ' highestPartnership');
      const { highestPartnership } = this.state
      this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.currentPartnership, this.state.avgWicket));
    });


  }
  else if (clickFrom === 'addBall') {
    console.log('hit addBall area');
    console.log(latestPartnership);
    console.log(this.props.partnership.highestPartnership);

    //turn latestPartnership and this.props.partnership.highestPartnership into numeric values
    const latestPartnershipNum = Number(latestPartnership);
    const highestPartnershipNum = Number(this.props.partnership.highestPartnership);

    console.log(latestPartnershipNum);
    console.log(highestPartnershipNum);

    //let currentBall = `${over}.${ball}`
    if (latestPartnershipNum > highestPartnershipNum && wickets > 0 ) {
      console.log(latestPartnership);
      this.setState({
        highestPartnership: latestPartnership,
        currentPartnership: latestPartnership,
      }, function () {
        console.log(this.props.partnership.partnerships  + ' partnerships');
        const { highestPartnership, currentPartnership } = this.state
        this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.currentPartnership, this.state.avgWicket ));
      });
    }
    else {
      console.log('Hit when latest partnership is less than highest partnership');

      //let latestPartnershipInt = parseInt(latestPartnership, 10);
      if (latestPartnership < 0) {

        wicketBalls.pop();
        latestPartnership = 0;
        let currentBallOver = `${over}.${ball}`;

        this.props.wicket.wicketBalls
        wicketBalls.push(currentBallOver);
        this.setState({wicketBalls: wicketBalls}, function () {
          console.log(this.props.wicket.wicketBalls  + ' wicketBalls');
          const { wicketBalls } = this.state
          this.props.dispatch(updatePartnership(this.state.wicket, this.state.wicketBalls ));
        });

        this.setState({
          currentPartnership: latestPartnership,
        }, function () {
          console.log(this.props.partnership.partnerships  + ' partnerships');
          const { currentPartnership } = this.state
          this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.currentPartnership, this.state.avgWicket ));
        });

      }
      else if (ball != 0) {
        console.log('hit when ball not equal to 0');
        console.log(latestPartnership);

      this.setState({
        currentPartnership: latestPartnership,
        highestPartnership: this.props.partnership.highestPartnership,
      }, function () {
        console.log(this.props.partnership.partnerships  + ' partnerships');
        const { highestPartnership, currentPartnership } = this.state
        this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.currentPartnership, this.state.avgWicket ));
      });

    }
    else {
      latestPartnership = this.props.partnership.currentPartnership;

      this.setState({
        currentPartnership: latestPartnership,
      }, function () {
        console.log(this.props.partnership.partnerships  + ' partnerships');
        const { currentPartnership } = this.state
        this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.currentPartnership, this.state.avgWicket ));
      });

    }
    }

  }



  }

  averagePartnerhsip = (wickets, ball, over) => {
      //if (ball != 0) {
        /*
        Work out the average overs per/partnerhsip:
        */
        let getpartnershipDiff = BallDiff.getpartnershipDiff(ball, over);
        let totalBalls = getpartnershipDiff[1];
        console.log(totalBalls);

        //divide totalballs by Wickets (70 / 2 = 35)
        let quotient;
        if (wickets >= 1) {
          quotient = Math.floor(totalBalls/wickets);
          }
        else {
          quotient = 0;
          }

          console.log(quotient);


        //divide the above by 6 and the remainder are the balls (35 goes into 6 5 times with 5 balls remoainder - i.e 5.5)
        let getpartnershipDiffTotal = BallDiff.getpartnershipDiffTotal(quotient);
        let quotientBalls = getpartnershipDiffTotal[0];
        let remainderAvg = getpartnershipDiffTotal[1];

        console.log(quotientBalls);
        console.log(remainderAvg);

        let remainderExtra;
        if (ball <= 2) {
          remainderExtra = '';
        }
        else if (wickets > 2 && ball > 2) {
          remainderExtra = 5;
        }
        else {
          remainderExtra = '';
        }

        console.log(remainderExtra);

        let avgWicket;
        console.log(avgWicket);

        if (wickets > 1 || wickets === 0) {
          console.log('wickets 0 or more than 1 hit');
        //5.5 * 2 in cricket is 5 *2 = 10 overs + 10 balls = 11.4 - woo!
        avgWicket = `${quotientBalls}.${remainderAvg}${remainderExtra}`;
      }
      else {
        console.log('wicket === 1 so this should be hit');
        let overBall = `${over}.${ball}`;
        avgWicket = overBall;
      }

      console.log(avgWicket);

/*
        this.setState({
          avgWicket: avgWicket,
        }, function () {
          console.log(this.props.partnership.avgWicket  + ' avgWicket');
          const { avgWicket } = this.state
          this.props.dispatch(updatePartnership( this.state.avgWicket ));
        });
        */
        return [avgWicket];
      //}

      //return [null];


  }



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
  partnership: state.partnership,
  partnerships: state.partnerships,
  wicket: state.wicket,
  wicketBall: state.wicketBall,
  reset: state.reset,
});

export default connect(mapStateToProps)(Ball);
