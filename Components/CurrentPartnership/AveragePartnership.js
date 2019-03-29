import React, { Component } from 'react';

/*
Native base and React native
*/
import { Container, Footer, Text, Icon, H1, H2, H3, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio, Platform, Dimensions } from 'react-native';

/*
Redux imports
*/

import { connect } from "react-redux";
import { updatePartnership } from '../../Reducers/partnership';
import { updateWicket } from '../../Reducers/wicket';
import { updateOver } from '../../Reducers/over';


// Custom Styles
//const dimen = Dimensions.get('window');
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
const styles = StyleSheet.create({
  textHeader: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '300',
    fontSize: PixelRatio.get() === 1 ? 16 : PixelRatio.get() === 1.5 ? 18 : PixelRatio.get() === 2 && (width < 414) ? 22 : PixelRatio.get() === 2 && (width === 414) ? 24 : PixelRatio.get() === 3.5 ? 24 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 20 : PixelRatio.get() === 3 && (width === 414) && Platform.OS === 'ios' ? 24 : 22,
  },
  textDesc: {
    color: '#eee',
    fontWeight: '100',
    marginTop: 0,
  },
  colCenter: {
    alignItems: 'center',
  },
  verticleRule: {
    borderRightColor: '#fff',
    borderRightWidth: 0.5,
    height: '100%',
  },
  currentPartnershipNumber: {
    fontSize: PixelRatio.get() === 1 ? 24 : PixelRatio.get() === 1.5 ? 30 : PixelRatio.get() === 2 ? 35 : 40,
    color: '#fff',
    lineHeight: PixelRatio.get() === 1 ? 24 : PixelRatio.get() === 1.5 ? 30 : PixelRatio.get() === 2 ? 35 : 40,
  },
});

class averagePartnership extends Component {
  state = {
    wicket: this.props.wicket.wicket || 0,
    wicketBalls: this.props.wicket.wicketBalls || [],
    ball: this.props.ball.ball || 0,
    over: this.props.ball.over || 0,
    highestPartnership: this.props.partnership.highestPartnership || 0,
    partnerships: this.props.partnership.partnerships || [],
    currentPartnership: this.props.partnership.currentPartnership || 0,
    avgWicket: this.props.partnership.avgWicket || 0,
  };

  handleChange = ( ball, wicket, partnership ) => {
    this.setState({ ball });
    this.setState({ wicket });
    this.setState({ partnership });
  };

currentPartnershipDisplay = () => {
  console.log(this.props.partnership.avgWicket);
  console.log(this.props.wicket.wicket);
  let avgPartnership = this.props.partnership.avgWicket;
  let avgPartnershipOneDecimal = parseFloat(avgPartnership).toFixed(1);

    if (this.props.partnership.avgWicket === 0.0 || this.props.partnership.avgWicket === 0 || this.props.partnership.avgWicket === undefined) {
        return (<H1 style={styles.currentPartnershipNumber}>~</H1>)
    }
    else {
      return (<H1 style={styles.currentPartnershipNumber}>{avgPartnershipOneDecimal}</H1>)
    }
  /*
  if (this.props.partnership.avgWicket < 10 && this.props.wicket.wicket > 1) {
    let avgPartnership = this.props.partnership.avgWicket;
    let remainderAvg = avgPartnership % 1;
    remainderAvg *= 10;
    let remainderAvgSecondDecimal = remainderAvg % 1;
    remainderAvgSecondDecimal *= 10;
    let decimalRound = Math.round(remainderAvgSecondDecimal * 100) / 100;
    let avgWicket
    if (decimalRound === 5) {
      return (
    <H1 style={{fontSize: 40, lineHeight: 40, color: '#fff'}}>{this.props.partnership.avgWicket}</H1>
      )
    }
    else {
    return (
  <H1 style={{fontSize: 40, lineHeight: 40, color: '#fff', marginTop: 10}}>{this.props.partnership.avgWicket}</H1>
    )
  }
  }
  else if (this.props.partnership.avgWicket >= 10 && this.props.wicket.wicket > 1) {
    return (
  <H1 style={{fontSize: 40, lineHeight: 40, color: '#fff'}}>{this.props.partnership.avgWicket}</H1>
  )
  }
  else if (this.props.partnership.avgWicket < 10 && this.props.wicket.wicket === 0) {
    return (
    <H1 style={{fontSize: 40, lineHeight: 40, color: '#fff'}}>~</H1>
  )
  }
  else if (this.props.partnership.avgWicket < 10 && this.props.wicket.wicket <= 1) {
    return (
    <H1 style={{fontSize: 40, lineHeight: 40, color: '#fff'}}>{this.props.partnership.avgWicket}</H1>
  )
  }
  else if (this.props.partnership.avgWicket >= 10 && this.props.wicket.wicket <= 1) {
    return (
    <H1 style={{fontSize: 40, lineHeight: 40, color: '#fff'}}>{this.props.partnership.avgWicket}</H1>
  )
  }
  */
}
  render() {
    return (
            <Col>
              <Row>
                <Col style={styles.colCenter}>
                  <Row>
                    <H3 style={styles.textHeader}>Average Partnership</H3>
                  </Row>
                  <Row>
                    <Text style={styles.currentPartnershipNumber}>
                      {this.currentPartnershipDisplay()}
                    </Text>
                  </Row>
                  <Row>
                    <Text style={styles.textDesc}>overs</Text>
                  </Row>
                </Col>
              <View style={styles.verticleRule} />
            </Row>
          </Col>

    );
  }
}

const mapStateToProps = state => ({
  wicket: state.wicket,
  ball: state.ball,
  partnership: state.partnership,
});

export default connect(mapStateToProps)(averagePartnership);
