import React, { Component } from 'react';

/*
Native base and React native
*/
import { Container, Footer, Text, Icon, H1, H3, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View } from 'react-native';

/*
Redux Imports
*/
import { connect } from "react-redux";
import { updatePartnership } from '../../Reducers/partnership';

// Custom Styles
const styles = StyleSheet.create({
  textHeader: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  textDesc: {
    color: '#eee',
    fontWeight: '100',
    lineHeight: -50,
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
});

class HighestPartnerhsip extends Component {
  state = {
    highestPartnership: this.props.partnership.highestPartnership || 0,
    partnerships: this.props.partnership.partnerships || [],
    associatedWith: this.props.partnership.associatedWith || '',
    currentPartnership: this.props.partnership.currentPartnership || 0,
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
              <H1 style={{fontSize: 40, lineHeight: 40, color: '#fff'}}>
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
