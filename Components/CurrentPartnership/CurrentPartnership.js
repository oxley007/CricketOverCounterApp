import React, { Component } from 'react';

/*
Redux imports
*/
import { connect } from "react-redux";
import { updatePartnership } from '../../Reducers/partnership';
import { updateToggle } from '../../Reducers/toggle';
import { updateOver } from '../../Reducers/over';

/*
Native base and react native
*/
import { Container, Footer, H2, H1, Text, Icon, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio, Platform, Dimensions } from 'react-native';

console.log(PixelRatio.get());

// Custom Styles
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
const styles = StyleSheet.create({
  textHeader: {
    color: '#fff',
    fontWeight: '300',
    //fontSize: 9 * PixelRatio.get(),
    //fontSize: Platform.OS === 'ios' ? 9 * PixelRatio.get() : 15 * PixelRatio.get(),
    //fontSize: PixelRatio.get() === 1.5 ? 20 : 24,
    fontSize: PixelRatio.get() === 1 ? 16 : PixelRatio.get() === 1.5 ? 20 : PixelRatio.get() === 2 && (width < 414) ? 22 : PixelRatio.get() === 2 && (width === 414) ? 24 : PixelRatio.get() === 3.5 ? 24 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 20 : 24,
    //fontSize: Platform.OS === 'ios' ? 24 : 12,
    //lineHeight: PixelRatio.get() === 1 ? 16 : PixelRatio.get() === 1.5 ? 20 : PixelRatio.get() === 2 ? 22 : PixelRatio.get() === 3.5 ? 24 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 20 : 24,
  },
  textDesc: {
    color: '#eee',
    fontWeight: '100',
    //fontSize: 5 * PixelRatio.get()
    fontSize: PixelRatio.get() === 1 ? 10 : PixelRatio.get() === 1.5 ? 12 : PixelRatio.get() === 2 && (width < 414) ? 14 : PixelRatio.get() === 2 && (width === 414) ? 16 : PixelRatio.get() === 3.5 ? 14 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 14 : 16,
  },
  textHeaderNumber: {
    color: '#fff',
    //fontSize: 40,
    fontSize: PixelRatio.get() === 1 ? 28 : PixelRatio.get() === 1.5 ? 32 : PixelRatio.get() === 2 && (width < 414) ? 34 : PixelRatio.get() === 2 && (width === 414) ? 40 : PixelRatio.get() === 3.5 ? 38 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 34 : 40,
    lineHeight: 40,
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
  colVerticleAlign: {
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  rowPadding :{
    paddingTop: 15,
  },
  upgradeStyle: {
    fontSize: PixelRatio.get() === 1 ? 10 : PixelRatio.get() === 1.5 ? 12 : PixelRatio.get() === 2 ? 14 : PixelRatio.get() === 3.5 ? 16 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 14 : 16,
  }
});

class currentPartnership extends Component {
  state = {
    toggle: this.props.toggle.togglePremium || false,
    ball: this.props.ball.ball || 0,
    over: this.props.ball.over || 0,
    highestPartnership: this.props.partnership.highestPartnership || 0,
    partnerships: this.props.partnership.partnerships || [],
    currentPartnership: this.props.partnership.currentPartnership || 0,
    avgWicket: this.props.partnership.avgWicket || 0,
  };

  handleChange = ( ball, toggle, partnership ) => {
    this.setState({ ball });
    this.setState({ toggle });
    this.setState({ partnership });
  };

currentPartnershipDispay() {
  console.log(this.props.toggle.togglePremium);
  console.log(this.props.ball.over);
  if (this.props.toggle.togglePremium === false && this.props.ball.over >= 10) {
  return (
  <Row>
    <Col size={4} style={styles.colVerticleAlign}>
      <Button rounded success onPress={() => this.props.navigation.navigate('Upgrade')} >
        <Text style={styles.upgradeStyle}>Upgrade</Text>
      </Button>
    </Col>
    <Col size={8} style={styles.colCenter}>
      <Row><H1 style={styles.textHeader}>Upgrade to pro</H1></Row>
      <Row><Text style={styles.textDesc}>to show current partnership and over timer for the entire innings</Text></Row>
    </Col>
  </Row>
)
}
else {
  console.log(this.props.partnership.currentPartnership);
  return (
  <Row>
    <Col size={9}>
      <Row><H1 style={styles.textHeader}>Current Partnership:</H1></Row>
      <Row><Text style={styles.textDesc}>The current partnership in overs</Text></Row>
    </Col>
    <Col size={3} style={styles.colCenter}>
      <Row>
        <H1 style={styles.textHeaderNumber}>{this.props.partnership.currentPartnership}</H1>
      </Row>
      <Row>
        <Text style={styles.textDesc}>Overs</Text>
      </Row>
    </Col>
  </Row>
)
}
}

  render() {
    return (
      <Grid style={styles.rowPadding}>
        {this.currentPartnershipDispay()}
      </Grid>
    );
  }
}

const mapStateToProps = state => ({
  toggle: state.toggle,
  ball: state.ball,
  partnership: state.partnership,
  settings: state.settings,
});

export default connect(mapStateToProps)(currentPartnership);
