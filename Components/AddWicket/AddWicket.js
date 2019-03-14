import React, { Component } from 'react';

import BallDiff from '../../Util/BallDiff.js';
import BallCalc from '../../Util/BallCalc.js';

/*
Native base and react native
*/
import { Container, Footer, H2, Text, Icon, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, Vibration, PixelRatio } from 'react-native';

/*
vibrate import
*/
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

/*
Redux imports
*/
import { connect } from "react-redux";
import { updateWicket } from '../../Reducers/wicket';
import { updateOver } from '../../Reducers/over';
import { updatePartnership } from '../../Reducers/partnership';
import { updatePartnerships } from '../../Reducers/partnerships';
import { updateStopwatch } from '../../Reducers/stopwatch';
import { updateWicketBall } from '../../Reducers/wicketball';

const formattedSeconds = (sec) =>
  Math.floor(sec / 60) +
    '.' +
  ('0' + sec % 60).slice(-2)

  //contasnts for vibration.
  //const DURATION = 10000;
  //const PATTERN = [500, 100, 1000];

class AddWickets extends Component {
  state = {
    wicket: this.props.wicket.wicket || 0,
    wicketBalls: this.props.wicket.wicketBalls || [],
    ball: this.props.ball.ball || 0,
    over: this.props.ball.over || 0,
    highestPartnership: this.props.partnership.highestPartnership || 0,
    partnerships: this.props.partnerships.partnerships || [],
    currentPartnership: this.props.partnership.currentPartnership || 0,
    avgWicket: this.props.partnership.avgWicket || 0,
    wicketBall: this.props.wicketBall.wicketBall || false,
  };

  handleChange = ( ball, wicket, partnership, partnerships, wicketBall ) => {
    this.setState({ ball });
    this.setState({ wicket });
    this.setState({ partnership });
    this.setState({ partnerships });
    this.setState({ wicketBall });
  };



  addWicket = () => {

    //Vibration.vibrate(PATTERN);
    ReactNativeHapticFeedback.trigger('notificationSuccess', true);

    let wicketBallFlag = true;
    this.setState({
      wicketBall: wicketBallFlag,
    }, function () {
      //console.log(this.state.over  + ' over');
      const { wicketBall } = this.state
      this.props.dispatch(updateWicketBall(this.state.wicketBall));
    })

    let over = this.props.ball.over;
    let ball = this.props.ball.ball;

    //this.stopwatch();

    console.log(ball);
    if (ball <= 5) {
    ball++;
    }
    else if (ball === 6) {
      ball = 0;
      over++;
    }

    let wicketBall = `${over}.${ball}`;


    let wickets = this.props.wicket.wicket;
    wickets++;

    this.setState({
      ball: ball,
      over: over,
    }, function () {
      console.log(this.state.ball  + ' ball');
      console.log(this.state.over  + ' over');
      const { ball, over } = this.state
      this.props.dispatch(updateOver(this.state.ball, this.state.over));
    })

    //call highest partnership
    let clickFrom = 'wicket';

    console.log(wickets);
    console.log(ball);
    console.log(over);
    console.log(wicketBall);
    console.log(clickFrom);
    this.highestPartnership(wickets, ball, over, wicketBall, clickFrom);


    let wicketBalls = this.props.wicket.wicketBalls.slice();
    wicketBalls.push(wicketBall);


    this.setState({
      wicketBalls: wicketBalls,
      wicket: wickets,
    }, function () {
      const { wicket, wicketBalls } = this.state
      this.props.dispatch(updateWicket(this.state.wicket, this.state.wicketBalls));
    });

    //call average partnership
    this.averagePartnerhsip(wickets, ball, over);



    console.log(this.props.wicket.wicket);
    console.log(this.props.wicket.wicketBalls);
    console.log(this.props.ball.ball);
    console.log(this.props.ball.over);
    console.log(this.props.partnership.highestPartnership);
    console.log(this.props.partnerships.partnerships);
    console.log(this.props.partnership.currentPartnership);
    console.log(this.props.partnership.avgWicket);
    console.log(this.props.wicketBall.wicketBall);


  }

  highestPartnership = (wickets, ball, over, wicketBall, clickFrom) => {
    //workout the balls between each wicket
    //the first wicket is just the over so far
    let highestPartnership;
    let latestPartnership;
    let partnershipBall;
    let partnershipOver;

    //let partnerships = this.props.partnership.partnerships.slice();
    let partnerships = this.props.partnerships.partnerships;
    console.log(partnerships);

    let wicketBalls = this.props.wicket.wicketBalls;

    console.log(wickets + ' ' + clickFrom);

    if (wickets === 1 && clickFrom === 'wicket') {
      console.log('hit if wickets 1 and click form wicket.');
      highestPartnership = wicketBall;
      latestPartnership = wicketBall;
    }
    else {
      //the second wicket and more needs to take the current over minus the previous wicket over
      latestPartnership = BallCalc.getOverDiff(wicketBalls, partnershipOver, over, ball, partnershipBall);
    }


    console.log(latestPartnership);
    console.log();
    // we then store this into an array partershipTotals
      partnerships.push(latestPartnership);

      this.setState({
        partnerships: partnerships,
      }, function () {
        const { partnerships } = this.state
        this.props.dispatch(updatePartnerships(this.state.partnerships ));
      });

      console.log(partnerships);

      //then use max to find highest partenership and store in state.
      let highPartnership = Math.max.apply(null, partnerships);

      console.log(highPartnership);

      // get the highest partnership and strip into sperate overs and ball variables.
      let highestPartnershipDiff = BallDiff.getOverAndBallSeperation(highPartnership);
      let highPartnersipOver = highestPartnershipDiff[0];

      let highPartnersipBall = highestPartnershipDiff[1];

      if (highPartnersipBall === 6) {
        highPartnership = highPartnersipOver + 1;
    }

    console.log(highPartnership);
    console.log(latestPartnership);
    console.log(wickets);

    if (wickets === 1) {
      console.log('Wickets = 1 Addwicket');
      this.setState({
        highestPartnership: highPartnership,
        currentPartnership: latestPartnership,
      }, function () {
        const { highestPartnership, currentPartnership } = this.state
        this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.currentPartnership, this.state.avgWicket));
      });
    }
    else {
    this.setState({
      highestPartnership: highPartnership,
      currentPartnership: 0.0,
    }, function () {
      const { highestPartnership, currentPartnership } = this.state
      this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.currentPartnership, this.state.avgWicket));
    });
  }

  }

  averagePartnerhsip = (wickets, ball, over) => {
      if (ball != 0) {

        /*
        Work out the average overs per/partnerhsip:
        */
        let getpartnershipDiff = BallDiff.getpartnershipDiff(ball, over);
        let totalBalls = getpartnershipDiff[1];

        //divide totalballs by Wickets (70 / 2 = 35)
        let quotient;
        if (wickets >= 1) {
          quotient = Math.floor(totalBalls/wickets);
          }
        else {
          quotient = 0;
          }


        //divide the above by 6 and the remainder are the balls (35 goes into 6 5 times with 5 balls remoainder - i.e 5.5)
        let getpartnershipDiffTotal = BallDiff.getpartnershipDiffTotal(quotient);
        let quotientBalls = getpartnershipDiffTotal[0];
        let remainderAvg = getpartnershipDiffTotal[1];

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

        //5.5 * 2 in cricket is 5 *2 = 10 overs + 10 balls = 11.4 - woo!
        let avgWicket = `${quotientBalls}.${remainderAvg}${remainderExtra}`;

        this.setState({
          avgWicket: avgWicket,
        }, function () {
          const { avgWicket } = this.state
          this.props.dispatch(updatePartnership( this.state.highestPartnership, this.state.currentPartnership, this.state.avgWicket ));
        });
    }

  }

  checkFrom() {
    if (this.props.fromWicket === true) {
    return (
      <Button rounded style={{backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0}} onPress={this.addWicket} title="Click me" >
    <Icon style={styles.wicketAdd} name='add' />
    </Button>
  )
  }
  else {
    return (
      <Button rounded light onPress={this.addWicket}>
        <Text style={{color: 'red'}}>W+</Text>
      </Button>
  )
  }
  }


render() {
  return (
    <Grid>
      {this.checkFrom()}
    </Grid>
  );
}
}

const mapStateToProps = state => ({
  wicketBall: state.wicketBall,
  wicket: state.wicket,
  ball: state.ball,
  partnership: state.partnership,
  partnerships: state.partnerships,
});

export default connect(mapStateToProps)(AddWickets);

// Custom Styles
const styles = StyleSheet.create({
  wicketAdd: {
    fontSize: PixelRatio.get() === 1 ? 10 : PixelRatio.get() === 1.5 ? 12 : PixelRatio.get() === 2 ? 14 : 18,
    //color: '#fff',
    //lineHeight: PixelRatio.get() === 1 ? 24 : PixelRatio.get() === 1.5 ? 30 : PixelRatio.get() === 2 ? 30 : 40,
  },
});
