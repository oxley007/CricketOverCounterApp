import React, { Component } from 'react';
/*
Redux imports*/
import { connect } from "react-redux";
import { updateOver } from '../../Reducers/over';

/*
Nativebase and React Nariveimports
*/
import { Container, Header, Content, Button, Text, Icon } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View} from 'react-native';


const styles = StyleSheet.create({
    smallCircle: {
      height: 50,
      width: 50,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    smallIcon: {
      color: '#c471ed',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 'auto',
      marginRight: 'auto',
      marginTop: 5,
      marginBottom: 'auto',
      fontSize: 30
    },
});


class BallRemove extends Component {

  state = {
    ball: this.props.ball.ball || 0,
    over: this.props.ball.over || 0,
  };

  handleChange = ball => {
    this.setState({ ball });
  };

removeBall = () => {

  let overs = this.props.ball.over;
  let balls  = this.props.ball.ball;

  if (balls > 0) {
  balls--;
  }
  else if (balls === 0 && overs >= 1) {
    overs--;
    balls = 6;
  }

    /*
    ****ADD BACK IN ONCE WORCKET STORE CREATED:****
    let clickFrom = 'addBall';
    this.props.highestPartnership(this.props.wickets, ball, overs, null, clickFrom);
    */


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
        <Button rounded small style={styles.smallCircle} light onPress={this.removeBall} title="Click me">
          <Icon name='remove' style={styles.smallIcon} />
        </Button>
    );
  }
}

const mapStateToProps = state => ({
  ball: state.ball,
  over: state.over,
});

export default connect(mapStateToProps)(BallRemove);
