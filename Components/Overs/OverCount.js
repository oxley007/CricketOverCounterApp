import React, { Component } from 'react';

/*
Native base and react native
*/
import { Container, Footer, H2 } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, Text } from 'react-native';

/*
Redux imports
*/
import { connect } from "react-redux";
import { updateOver } from '../../Reducers/over';


class OverCount extends Component {
  state = {
    ball: this.props.ball.ball || 0,
    over: this.props.ball.over || 0,
  };

  render() {
    return (
      <Text style={{ color: '#fff', fontSize: 55 }}>
        {this.props.ball.over}.{this.props.ball.ball}
      </Text>
    );
  }
}

const mapStateToProps = state => ({
  ball: state.ball,
  over: state.over,
});


export default connect(mapStateToProps)(OverCount);
