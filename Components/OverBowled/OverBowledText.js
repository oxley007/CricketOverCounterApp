import React, { Component } from 'react';

/*
React Native and Native Base imports
*/
import { Container, Footer, Text } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio, Platform } from 'react-native';

/*
Redux imports
*/
import { updateOver } from '../../Reducers/over';
import { connect } from "react-redux";


const styles = StyleSheet.create({
    textOver: {
      color: '#fff',
      textAlign: 'center',
      fontSize: PixelRatio.get() === 1 ? 12 : PixelRatio.get() === 1.5 ? 14 : PixelRatio.get() === 2 ? 18 : PixelRatio.get() === 3.5 ? 20 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 18 : 20,
      marginTop: "auto",
      marginBottom: "auto",
    }
});


class OverBowled extends Component {
  state = {
    ball: this.props.ball.ball || 0,
  };

  handleChange = ball => {
    this.setState({ ball });
  };

  overBowledText = () => {
    if (this.props.ball.ball === 6) {
      return <Text style={styles.textOver}>Over bowled</Text>
    }
    else {
      //nothing
    }
  }


  render() {
    return (
      <Col style={{height: 30}}>
      {this.overBowledText()}
      </Col>
    );
  }
}

const mapStateToProps = state => ({
  ball: state.ball,
});

export default connect(mapStateToProps)(OverBowled);


/*
export default compose(
  withStyles(styles),
  connect(mapStateToProps, mapDispatchToProps)
  )(OverBowled);
  */
