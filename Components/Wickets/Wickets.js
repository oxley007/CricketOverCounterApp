import React, { Component } from 'react';
import WicketsDisplay from './WicketsDisplay';
import AddWicket from '../AddWicket/AddWicket.js';

/*
Native base and react native
*/
import { Container, Footer, H2, H1, Text, Icon, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio, Platform, Dimensions } from 'react-native';

/*
Redux Nariveimports
*/
import { connect } from "react-redux";
import { updateWicket } from '../../Reducers/wicket';
import { updateOver } from '../../Reducers/over';

// Custom Styles
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
const styles = StyleSheet.create({
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
  colCenter: {
    alignItems: 'center',
  },
  horizontalRule: {
    borderBottomColor: '#fff',
    borderBottomWidth: 0.5,
    width: '100%',
    marginTop: 15,
    marginBottom: 15,
  },
  wicketRemove: {
    fontSize: PixelRatio.get() === 1 ? 10 : PixelRatio.get() === 1.5 ? 12 : PixelRatio.get() === 2 ? 14 : 18,
    //color: '#fff',
    //lineHeight: PixelRatio.get() === 1 ? 24 : PixelRatio.get() === 1.5 ? 30 : PixelRatio.get() === 2 ? 30 : 40,
  },
});

class Wickets extends Component {
  state = {
    wicket: this.props.wicket.wicket || 0,
    wicketBalls: this.props.wicket.wicketBalls || [],
    ball: this.props.ball.ball || 0,
    over: this.props.ball.over || 0,
  };

  handleChange = ( ball,  wicket ) => {
    this.setState({ ball });
    this.setState({ wicket });
  };



  removeWicket = () => {

    let wickets = this.props.wicket.wicket;
    wickets--;

    /*
    ******* PROBABLY NEED TO REMOVE LAST ENTRY FORM WICKETBALL ONCE MORE REDUCERS SETUP *********
    */
    let wicketBalls = this.props.wicket.wicketBalls.slice(0,-1);
    console.log(wicketBalls);
    this.setState({
      wicket: wickets,
      wicketBalls: wicketBalls,
    }, function () {
      console.log(this.props.wicket.wicketBalls  + ' wicketBalls remove');
      const { wickets, wicketBalls } = this.state
      this.props.dispatch(updateWicket( this.state.wicket, this.state.wicketBalls ));
    });

  }

  addWicket = () => {
    let wickets = this.props.wicket.wicket;
    wickets++;

    console.log('addWicket is hit.');

    this.setState({
      wicket: wickets,
    }, function () {
      console.log(this.props.wicket.wicket  + ' wicket');
      const { wicket } = this.state
      this.props.dispatch(updateWicket(this.state.wicket));
    });

    /*
    ******* TO ADD TO ONCE MORE REDUCERS SETUP *********
    */

    let over = this.props.ball.over;
    let ball = this.props.ball.ball;
    let wicketBall = `${over}.${ball}`;
    console.log(wicketBall + ' Wicket Ball form addWicket()');

    //******** TO DO *********
    //let clickFrom = 'wicket';
    //this.highestPartnership(wickets, ball, over, wicketBall, clickFrom);

    let wicketBalls = this.props.wicket.wicketBalls.slice();
    wicketBalls.push(wicketBall);
    this.setState({wicketBalls: wicketBalls}, function () {
      console.log(this.props.wicket.wicketBalls  + ' wicketBalls');
      const { wicketBalls } = this.state
      this.props.dispatch(updateWicket(this.state.wicketBalls));
    });

    //******** TO DO *********
    //this.averagePartnerhsip(wickets, ball, over);

  }


  render() {
    const fromWicket = true;
    return (
      <Grid style={{width: '100%' }}>
        <Row>
          <Col size={8}>
            <Row><H1 style={styles.textHeader}>Wickets:</H1></Row>
            <Row><Text style={styles.textDesc}>Total wickets in this innings.</Text></Row>
          </Col>
          <Col size={4}>
            <Row>
            <Button rounded style={{backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0}} onPress={this.removeWicket} title="Click me">
            <Icon style={styles.wicketRemove} name='remove' />
            </Button>
            <WicketsDisplay wickets={this.props.wickets} />
            <AddWicket fromWicket={fromWicket} />
            </Row>
          </Col>
        </Row>
        <View style={styles.horizontalRule} />
      </Grid>
    );
  }
}

const mapStateToProps = state => ({
  wicket: state.wicket,
  ball: state.ball,
});

export default connect(mapStateToProps)(Wickets);
