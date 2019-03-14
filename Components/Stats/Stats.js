import React, { Component } from 'react';
import CurrentPartnership from '../CurrentPartnership/CurrentPartnership.js';
import AveragePartnership from '../CurrentPartnership/AveragePartnership.js';
import HighestPartnership from '../HighestPartnership/HighestPartnership.js';

/*
Native base and React native
*/
import { Container, Footer, Text, Icon, H2, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View } from 'react-native';

// Custom Styles
const styles = StyleSheet.create({
  horizontalRule: {
    borderBottomColor: '#fff',
    borderBottomWidth: 0.5,
    width: '100%',
    marginTop: 15,
    marginBottom: 15,
  },
  verticleRule: {
    borderRightColor: '#fff',
    borderRightWidth: 0.5,
    height: '100%',
    marginRight: 10,
    marginLeft: 10,
  },
});

class AdviceBatting extends Component {
  render() {
    return (
      <Col>
        <Col size={1}>
          <CurrentPartnership navigation={this.props.navigation} />
          <View style={styles.horizontalRule} />
        </Col>
      <Row>
        <Col size={1}>
          <AveragePartnership />
          <View style={styles.horizontalRule} />
        </Col>
        <Col size={1}>
          <HighestPartnership />
          <View style={styles.horizontalRule} />
        </Col>
      </Row>
      </Col>
    )
  }
}


export default AdviceBatting;
