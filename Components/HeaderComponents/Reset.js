import React, { Component } from 'react';

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
import { updateReset } from '../../Reducers/reset';
import { updateStopwatch } from '../../Reducers/stopwatch';
import { updateOver } from '../../Reducers/over';
import { updateWicket } from '../../Reducers/wicket';
import { updatePartnership } from '../../Reducers/partnership';


class Reset extends Component {
  state = {
    secondsElapsed: this.props.stopwatch.secondsElapsed || 0,
    laps: this.props.stopwatch.laps || [],
    lastClearedIncrementer: this.props.stopwatch.lastClearedIncrementer || null,
    incrementer: this.props.stopwatch.incrementer || null,
    avgBall: this.props.stopwatch.avgBall || [],
    avgSeconds: this.props.stopwatch.avgSeconds || 0,
    ball: this.props.ball.ball || 0,
    over: this.props.ball.over || 0,
    wicket: this.props.wicket.wicket || 0,
  };

  handleChange = ( ball, stopwatch ) => {
    this.setState({ ball });
    this.setState({ stopwatch });
    this.setState({ wicket });
  };

incrementer = () => {
  console.log(this.state.incrementer);
  let incrementer = null;
  console.log(incrementer);
  this.setState({incrementer: incrementer});
}


handleStopClick = () => {
  console.log('stop hit');
    clearInterval(this.props.stopwatch.incrementer);

      let lastClearedIncrementer = this.props.stopwatch.lastClearedIncrementer;
      let secondsElapsed = this.props.stopwatch.secondsElapsed;
      let laps = this.props.stopwatch.laps;
      let incrementer = this.props.stopwatch.incrementer;

      this.props.addStopwatch({ secondsElapsed, laps, lastClearedIncrementer, incrementer });
      console.log(this.props.addStopwatch({ secondsElapsed, laps, lastClearedIncrementer, incrementer }));
    this.resetBuilder();
  }

  handleStopClick = () => {
      clearInterval(this.props.stopwatch.incrementer);
      this.setState({
        lastClearedIncrementer: this.props.stopwatch.incrementer
      });
    }

    resetBuilder = () => {
      let reset = 0;
      this.setState({reset: reset}
        , function () {
          console.log(this.props.reset.reset  + ' wicket');
          const { reset } = this.state
          this.props.dispatch(updateReset(this.state.reset))
        });

        //this.setState(this.baseState);

        let over = 0;
        let ball = 0;
        this.props.dispatch(updateOver(ball, over));

        let secondsElapsed = 0;
        let laps = [];
        let lastClearedIncrementer = null;
        let incrementer = null;
        let avgBall = [];
        let avgSeconds = 0;
        this.props.dispatch(updateStopwatch( secondsElapsed, laps, lastClearedIncrementer, incrementer, avgBall, avgSeconds ));
        //this.props.addStopwatch({ lastClearedIncrementer, laps, secondsElapsed });

        let wickets = 0;
        let wicketBalls = [];
        this.props.dispatch(updateWicket( wickets, wicketBalls ));

        let highestPartnership = 0;
        let partnerships = [];
        let currentPartnership = 0;
        let avgWicket = 0;
        this.props.dispatch(updatePartnership( highestPartnership, partnerships, currentPartnership ));
    }


  render() {
    return (
        <Button warning onPress={this.resetBuilder}>
          <Text>Yes</Text>
        </Button>
    );
  }
}

const mapStateToProps = state => ({
  ball: state.ball,
  reset: state.reset,
  stopwatch: state.stopwatch,
  wicket: state.wicket,
});

export default connect(mapStateToProps)(Reset);
