import React, { Component } from 'react';
import OverCount from "./OverCount";


/*
Native base and React native
*/
import { Container, Footer, Text, Icon, H2, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View } from 'react-native';

/*
Redux imports
*/
import { connect } from "react-redux";
import { updateOver } from '../../Reducers/over';


// Custom Styles
const styles = StyleSheet.create({
  textHeader: {
    color: '#fff',
  },
  colCenter: {
    alignItems: 'center',
  }
});


class Overs extends Component {
  state = {
    ball: this.props.ball.ball || 0,
    over: this.props.ball.over || 0,
  };

  handleChange = ball => {
    this.setState({ ball });
  };


  addOver = () => {
    let overs = this.props.ball.over;
    let ball  = this.props.ball.ball;

    overs++;
      this.addToRedux(ball, overs);

      /*
      KEEP FOR WHEN HIGHEST PARTNERSHIP IS SETUP
      */
      //let clickFrom = 'addBall';
      //this.props.highestPartnership(this.props.wickets, ball, overs, null, clickFrom);

    };




  removeOver = () => {
    console.log('remove over?');
    let overs = this.props.ball.over;
    let ball  = this.props.ball.ball;

    if (overs > 0) {
    overs--;
    }
    else {
      //do nothing
    }
      this.addToRedux(ball, overs);

      /*
      KEEP FOR WHEN HIGHEST PARTNERSHIP IS SETUP
      */
      let clickFrom = 'addBall';
      //this.props.highestPartnership(this.props.wickets, ball, overs, null, clickFrom);

    };


addToRedux = (balls, overs) => {
  this.setState({
    ball: balls,
    over: overs,
  }, function () {
    console.log(this.state.ball  + ' ball');
    console.log(this.state.over  + ' over');
    const { ball, over } = this.state
    this.props.dispatch(updateOver(this.state.ball, this.state.over));
  })
}



  render() {
    return (
      <Grid style={{width: '100%' }}>
        <Row size={12}>
        <Col style={styles.colCenter}>
            <H2 style={styles.textHeader}>OVERS:</H2>
          </Col>
        </Row>
        <Row size={12}>
          <Col style={styles.colCenter}>
              <Row>
              <Button style={{backgroundColor: 'transparent', marginTop: 'auto', marginBottom: 'auto'}} onPress={this.removeOver} title="Click me">
              <Icon name='remove' />
              </Button>
                <OverCount />
                <Button style={{backgroundColor: 'transparent', marginTop: 'auto', marginBottom: 'auto'}} onPress={this.addOver} title="Click me">
              <Icon name='add' />
              </Button>
          </Row>
          </Col>
        </Row>
      </Grid>
    );
  }
}

const mapStateToProps = state => ({
  ball: state.ball,
  over: state.over,
});

export default connect(mapStateToProps)(Overs);
