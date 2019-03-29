import React, { Component } from 'react';

/*
Native base and react native
*/
import { Container, Footer, H2, Text } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio, Platform, Dimensions } from 'react-native';

/*
Redux imports
*/
import { connect } from "react-redux";
import { updateWicket } from '../../Reducers/wicket';

/*
animation prackage
*/
import * as Animatable from 'react-native-animatable';


class WicketsDisplay extends Component {
  state = {
    wicket: this.props.wicket.wicket || 0,
  };

  componentDidUpdate() {
    if(this.animatedTextRefTwo)
   this.animatedTextRefTwo.startAnimation(2000,() => {})
}

  render() {
    return (
      <Animatable.Text animation="bounceIn" style={styles.wicketNumber} ref={ci => this.animatedTextRefTwo = ci}>
        {this.props.wicket.wicket}
      </Animatable.Text>
    );
  }
}

const mapStateToProps = state => ({
  wicket: state.wicket,
});

export default connect(mapStateToProps)(WicketsDisplay);

// Custom Styles
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
const styles = StyleSheet.create({
  wicketNumber: {
    fontSize: PixelRatio.get() === 1 ? 28 : PixelRatio.get() === 1.5 ? 32 : PixelRatio.get() === 2 && (width < 414) ? 34 : PixelRatio.get() === 2 && (width === 414) ? 40 : PixelRatio.get() === 3.5 ? 38 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 34 : 40,
    color: '#fff',
    lineHeight: PixelRatio.get() === 1 ? 28 : PixelRatio.get() === 1.5 ? 32 : PixelRatio.get() === 2 && (width < 414) ? 34 : PixelRatio.get() === 2 && (width === 414) ? 40 : PixelRatio.get() === 3.5 ? 38 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 34 : 40,
  },
});
