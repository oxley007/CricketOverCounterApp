import React, { Component } from 'react';

/*
Native base and React native
*/
import { Container, Footer, Text, Icon, H1, H3, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio, Platform, Dimensions } from 'react-native';

/*
Redux Imports
*/
import { connect } from "react-redux";
import { updatePartnership } from '../../Reducers/partnership';

// Custom Styles
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
    fontSize: PixelRatio.get() === 1 ? 24 : PixelRatio.get() === 1.5 ? 30 : PixelRatio.get() === 2 && (width < 414) ? 30 : PixelRatio.get() === 2 && (width === 414) ? 36 : 40,
    color: '#fff',
    lineHeight: PixelRatio.get() === 1 ? 24 : PixelRatio.get() === 1.5 ? 30 : PixelRatio.get() === 2 && (width < 414) ? 30 : PixelRatio.get() === 2 && (width === 414) ? 36 : 40,
  },
});

class HighestPartnerhsip extends Component {
  state = {
    highestPartnership: this.props.partnership.highestPartnership || 0,
    partnerships: this.props.partnership.partnerships || [],
    associatedWith: this.props.partnership.associatedWith || '',
    currentPartnership: this.props.partnership.currentPartnership || 0,
    avgWicket: this.props.partnership.avgWicket || 0,
  };

  handleChange = ( partnership ) => {
    this.setState({ partnership });
  };

  render() {
    return (
      <Col>
        <Row>
          <Col style={styles.colCenter}>
            <Row>
              <H3 style={styles.textHeader}>Highest Partnership</H3>
            </Row>
            <Row>
              <H1 style={styles.currentPartnershipNumber}>
                {this.props.partnership.highestPartnership}
              </H1>
            </Row>
            <Row>
              <Text style={styles.textDesc}>overs</Text>
            </Row>
          </Col>
      </Row>
      </Col>
    );
  }
}

const mapStateToProps = state => ({
  partnership: state.partnership,
});

export default connect(mapStateToProps)(HighestPartnerhsip);
