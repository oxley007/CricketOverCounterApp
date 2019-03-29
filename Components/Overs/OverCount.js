import React, { Component } from 'react';

/*
Native base and react native
*/
import { Container, Footer, H2 } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, Text, PixelRatio, Dimensions } from 'react-native';

/*
animation prackage
*/
import * as Animatable from 'react-native-animatable';

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

  componentDidUpdate() {
    if(this.animatedTextRef)
   this.animatedTextRef.startAnimation(2000,() => {})

   if(this.animatedTextRefOne && this.props.ball.ball === 0)
  this.animatedTextRefOne.startAnimation(3000,() => {})
}

  render() {
    return (

      <Col style={styles.colCenter}>
      <Row size={4}>
      <Animatable.Text animation="bounceIn" style={styles.overCountStyling} ref={ci => this.animatedTextRefOne = ci}>
        {this.props.ball.over}
      </Animatable.Text>
      <Text style={styles.overCountStyling}>
        .
      </Text>
      <Animatable.Text animation="bounceIn" style={styles.overCountStyling} ref={ci => this.animatedTextRef = ci}>
        {this.props.ball.ball}
      </Animatable.Text>
      </Row>
      </Col>
    );
  }
}

//<Text style={{ color: '#fff', fontSize: 55 }}>
//<Text>

const mapStateToProps = state => ({
  ball: state.ball,
  over: state.over,
});


export default connect(mapStateToProps)(OverCount);

// Custom Styles
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
const styles = StyleSheet.create({
  textHeader: {
    color: '#fff',
  },
  colCenter: {
    alignItems: 'center',
  },
  overCountStyling: {
    color: '#fff',
    fontSize: PixelRatio.get() === 1 ? 35 : PixelRatio.get() === 1.5 ? 40 : PixelRatio.get() === 2 && (width < 414) ? 40 : PixelRatio.get() === 2 && (width === 414) ? 55 : 55,
  },
});
