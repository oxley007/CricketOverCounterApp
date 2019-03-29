import React, { Component, applyMiddleware, createStore } from 'react';
import { persistStore } from 'redux-persist';

/*
Native base and react native
*/
import { Container, Footer, H2, Text, Icon, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio } from 'react-native';

/*
Redux imports
*/
import { connect } from "react-redux";
import { updateReset } from '../../Reducers/reset';
import { updateStopwatch } from '../../Reducers/stopwatch';
import { updateOver } from '../../Reducers/over';
import { updateWicket } from '../../Reducers/wicket';
import { updatePartnership } from '../../Reducers/partnership';
import { updatePartnerships } from '../../Reducers/partnerships';
//import { updateToggle } from '../../Reducers/toggle';


class Reset extends Component {
  state = {
    secondsElapsed: 0,
    laps: [],
    lastClearedIncrementer: null,
    incrementer: null,
    avgBall: [],
    avgSeconds: 0,
    ball: 0,
    over: 0,
    wicket: 0,
    wicketBalls: [],
    highestPartnership: 0,
    partnerships: [],
    currentPartnership: 0,
    avgWicket: 0,
    //togglePremium: false,
  };

  handleChange = ( ball, stopwatch, wicket, partnership, partnerships, reset, toggle ) => {
    this.setState({ ball });
    this.setState({ stopwatch });
    this.setState({ wicket });
    this.setState({ partnership });
    this.setState({ partnerships });
    this.setState({ reset });
    //this.setState({ toggle });
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

      let highestPartnership = this.props.highestPartnership;
      let partnerships = this.props.partnerships;
      let currentPartnership = this.props.currentPartnership;
      let avgWicket = this.props.avgWicket;


      this.props.addStopwatch({ secondsElapsed, laps, lastClearedIncrementer, incrementer });
      console.log(this.props.addStopwatch({ secondsElapsed, laps, lastClearedIncrementer, incrementer }));
      this.props.updatePartnership({highestPartnership, partnerships, currentPartnership, avgWicket});
      console.log(this.props.updatePartnership({highestPartnership, partnerships, currentPartnership, avgWicket}));
    this.resetBuilder();
  }

  handleStopClick = () => {
      clearInterval(this.props.stopwatch.incrementer);
      this.setState({
        lastClearedIncrementer: this.props.stopwatch.incrementer
      });
    }

/*
    resetBuilder = () => {
      let reset = 0;
      this.setState({reset: reset}
        , function () {
          console.log(this.props.reset.reset  + ' reset');
          const { reset } = this.state
          this.props.dispatch(updateReset(this.state.reset))
        });
        console.log(this.props);

          //let { allProps } = this.props;

        //this.props.dispatch(persistStore(allProps).purge());

        //const middlewares = [];

        const persistedReducer = persistStore(this.props).purge().then(this.props.dispatch(persistStore(persistedReducer)));

        console.log(persistedReducer);

        //this.props.dispatch(persistStore(persistedReducer));

        /*
        const store = createStore(
          persistedReducer,
          undefined,
        );

        const persistor = persistStore(store);
        persistor.purge()


        //let ball = this.props.ball.ball

      //console.log({this.props.ball});
      //persistStore().purge();
      console.log('hit reset build');
    }

*/


    resetBuilder = () => {
      let reset = 2;
      this.setState({reset: reset}
        , function () {
          console.log(this.props.reset.reset  + ' reset');
          const { reset } = this.state
          this.props.dispatch(updateReset(this.state.reset))
        });

        //this.setState(this.baseState);

        let over = 0;
        let ball = 0;
        this.props.dispatch(updateOver(ball, over));


        let highestPartnership = 0;
        let partnerships = [];
        let currentPartnership = 0;
        let avgWicket = 0;
        this.props.dispatch(updatePartnership( highestPartnership, currentPartnership, avgWicket ));
        this.props.dispatch(updatePartnerships( partnerships ));

        //this.props.dispatch(updatePartnership( 0, [], 0, 0 ));


        /*
        this.setState({
          highestPartnership: 0,
          partnerships: [],
          currentPartnership: 0,
          avgWicket: 0,
        }, function () {
          console.log(this.props.partnership.partnerships  + ' partnerships');
          const { highestPartnership, partnerships, currentPartnership, avgWicket } = this.state
          console.log(this.state.partnerships + ' state partnerships');
          this.props.dispatch(updatePartnership(this.state.highestPartnership, this.state.partnerships, this.state.currentPartnership, this.state.avgWicket ));
        });
        */


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

        reset = 2;
        this.props.dispatch(updateReset(reset))

        //let toggle = false;
        //this.props.dispatch(updateToggle(toggle))

    }


  render() {
    return (
        <Button rounded large warning style={styles.largeButton} onPress={this.resetBuilder}>
          <Text style={styles.buttonTextBack}>Yes</Text>
        </Button>
    );
  }
}

const mapStateToProps = state => ({
  ball: state.ball,
  reset: state.reset,
  stopwatch: state.stopwatch,
  wicket: state.wicket,
  partnership: state.partnership,
  partnerships: state.partnerships,
  //toggle: state.toggle,
});

export default connect(mapStateToProps)(Reset);

// Custom Styles
const styles = StyleSheet.create({
    largeButton: {
      width: '100%',
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      fontSize: PixelRatio.get() === 1 ? 28 : PixelRatio.get() === 1.5 ? 32 : PixelRatio.get() === 2 ? 36 : 40,
      color: '#c471ed',
      marginTop: 'auto',
      marginRight: 'auto',
      marginBottom: 'auto',
      marginLeft: 'auto',
      fontWeight: '200',
    },
    buttonTextBack: {
      fontSize: 20,
      color: '#c471ed',
      marginTop: 'auto',
      marginRight: 'auto',
      marginBottom: 'auto',
      marginLeft: 'auto',
      fontWeight: '200',
    },
    rowPadding :{
      paddingTop: 20,
    }
});
