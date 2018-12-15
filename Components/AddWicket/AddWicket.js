import React, { Component } from 'react';

import BallDiff from '../../Util/BallDiff.js';
import BallCalc from '../../Util/BallCalc.js';

/*
Native base and react native
*/
import { Container, Footer, H2, Text, Icon, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View } from 'react-native';

/*
Redux imports
*/
import { connect } from "react-redux";
import { updateWicket } from '../../Reducers/wicket';
import { updateOver } from '../../Reducers/over';
import { updatePartnership } from '../../Reducers/partnership';

class AddWickets extends Component {
  state = {
    wicket: this.props.wicket.wicket || 0,
    wicketBalls: this.props.wicket.wicketBalls || [],
    ball: this.props.ball.ball || 0,
    over: this.props.ball.over || 0,
    highestPartnership: this.props.partnership.highestPartnership || 0,
    partnerships: this.props.partnership.partnerships || [],
    currentPartnership: this.props.partnership.currentPartnership || 0,
    avgWicket: this.props.partnership.avgWicket || 0,
  };

  handleChange = ( ball, wicket, partnership ) => {
    this.setState({ ball });
    this.setState({ wicket });
    this.setState({ partnership });
  };



  addWicket = () => {
    let wickets = this.props.wicket.wicket;
    wickets++;

    this.setState({
      wicket: wickets,
      wicketBalls: wicketBalls,
    }, function () {
      console.log(this.props.wicket.wicket  + ' wicket');
      const { wicket, wicketBalls } = this.state
      this.props.dispatch(updateWicket(this.state.wicket, this.state.wicketBalls));
    })

    /*
    ******* TO ADD TO ONCE MORE REDUCERS SETUP *********
    */

    let over = this.props.ball.over;
    let ball = this.props.ball.ball;
    let wicketBall = `${over}.${ball}`;
    console.log(wicketBall + ' Wicket Ball form addWicket()');

    //******** TO DO *********
    let clickFrom = 'wicket';
    this.highestPartnership(wickets, ball, over, wicketBall, clickFrom);
    console.log('back in addWicket');

    let wicketBalls = this.props.wicket.wicketBalls.slice();
    wicketBalls.push(wicketBall);
    this.setState({
      wicketBalls: wicketBalls,
      wicket: wickets,
    }, function () {
      console.log(this.props.wicket.wicketBalls  + ' wicketBalls');
      const { wicket, wicketBalls } = this.state
      this.props.dispatch(updateWicket(this.state.wicket, this.state.wicketBalls));
    });

    //******** TO DO *********
    this.averagePartnerhsip(wickets, ball, over);
  }

  highestPartnership = (wickets, ball, over, wicketBall, clickFrom) => {

    console.log('hit hightestPartnership');
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
      highestPartnership = wicketBall;
      latestPartnership = wicketBall;
    }
    else if (wickets > 1 || (wickets >= 1 && clickFrom === 'addBall')) {
      //the second wicket and more needs to take the current over minus the previous wicket over
      latestPartnership = BallCalc.getOverDiff(wicketBalls, partnershipOver, over, ball, partnershipBall);
    }
    else {
      //nothng.
    }


    if (clickFrom === 'wicket') {

      console.log('hit clickFrom = wicket');
      console.log(latestPartnership);
    // we then store this into an array partershipTotals
      partnerships.push(latestPartnership);
      console.log(partnerships);

      this.setState({
        highestPartnership: this.props.partnership.highestPartnership,
        partnerships: partnerships,
        currentPartnership: this.props.partnership.currentPartnership,
        avgWicket: this.props.partnership.avgWicket,
      }, function () {
        console.log(this.props.partnership.partnerships  + ' partnerships');
        const { highestPartnership, partnerships, currentPartnership, avgWicket } = this.state
        this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.partnerships, this.state.currentPartnership, this.state.avgWicket ));
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

    this.setState({
      highestPartnership: highPartnership,
      partnerships: this.props.partnership.partnerships,
      currentPartnership: this.props.partnership.currentPartnership,
      avgWicket: this.props.partnership.avgWicket,
    }, function () {
      console.log(this.props.partnership.highestPartnership  + ' highestPartnership');
      const { highestPartnership, partnerships, associatedWith, currentPartnership, avgWicket } = this.state
      this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.partnerships, this.state.currentPartnership, this.state.avgWicket ));
    });

  }
  else if (clickFrom === 'addBall') {
    //let currentBall = `${over}.${ball}`
    if (latestPartnership > this.state.highestPartnership) {
      this.setState({
        highestPartnership: latestPartnership,
        partnerships: this.props.partnership.partnerships,
        currentPartnership: latestPartnership,
        avgWicket: this.props.partnership.avgWicket,
      }, function () {
        console.log(this.props.partnership.partnerships  + ' partnerships');
        const { highestPartnership, partnerships, associatedWith, currentPartnership, avgWicket } = this.state
        this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.partnerships, this.state.currentPartnership, this.state.avgWicket ));
      });
    }
    else {
      //let latestPartnershipInt = parseInt(latestPartnership, 10);
      if (latestPartnership < 0) {
        wicketBalls.pop();
        latestPartnership = 0;
        let currentBallOver = `${over}.${ball}`;

        wicketBalls.push(currentBallOver);
        this.setState({wicketBalls: wicketBalls});

        this.setState({
          highestPartnership: this.props.partnership.highestPartnership,
          partnerships: this.props.partnership.partnerships,
          currentPartnership: latestPartnership,
          avgWicket: this.props.partnership.avgWicket,
        }, function () {
          console.log(this.props.partnership.partnerships  + ' partnerships');
          const { highestPartnership, partnerships, associatedWith, currentPartnership, avgWicket } = this.state
          this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.partnerships, this.state.currentPartnership, this.state.avgWicket ));
        });

      }
      else if (ball != 0) {

      this.setState({
        highestPartnership: this.props.partnership.highestPartnership,
        partnerships: this.props.partnership.partnerships,
        currentPartnership: latestPartnership,
        avgWicket: this.props.partnership.avgWicket,
      }, function () {
        console.log(this.props.partnership.partnerships  + ' partnerships');
        const { highestPartnership, partnerships, associatedWith, currentPartnership, avgWicket } = this.state
        this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.partnerships, this.state.currentPartnership, this.state.avgWicket ));
      });

    }
    else {
      latestPartnership = this.state.currentPartnership;

      this.setState({
        highestPartnership: this.props.partnership.highestPartnership,
        partnerships: this.props.partnership.partnerships,
        currentPartnership: latestPartnership,
        avgWicket: this.props.partnership.avgWicket,
      }, function () {
        console.log(this.props.partnership.partnerships  + ' partnerships');
        const { highestPartnership, partnerships, associatedWith, currentPartnership, avgWicket } = this.state
        this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.partnerships, this.state.currentPartnership, this.state.avgWicket ));
      });

    }
    }

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
          highestPartnership: this.props.partnership.highestPartnership,
          partnerships: this.props.partnership.partnerships,
          currentPartnership: this.props.partnership.currentPartnership,
          avgWicket: avgWicket,
        }, function () {
          console.log(this.props.partnership.avgWicket  + ' avgWicket');
          const { highestPartnership, partnerships, associatedWith, currentPartnership, avgWicket } = this.state
          this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.partnerships, this.state.currentPartnership, this.state.avgWicket ));
        });
    }

  }

  render() {
    return (
      <Button rounded light onPress={this.addWicket}>
        <Text style={{color: 'red'}}>W+</Text>
      </Button>
    );
  }
}

const mapStateToProps = state => ({
  wicket: state.wicket,
  ball: state.ball,
  partnership: state.partnership,
});

export default connect(mapStateToProps)(AddWickets);
