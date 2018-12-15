import React, { Component } from 'react';

/*
Native base and react native
*/
import { Container, Footer, H2, Text } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View } from 'react-native';

/*
Redux imports
*/
import { connect } from "react-redux";
import { updateWicket } from '../../Reducers/wicket';


class WicketsDisplay extends Component {
  state = {
    wicket: this.props.wicket.wicket || 0,
  };

  render() {
    return (
      <Text style={{fontSize: 40, color: '#fff'}}>
        {this.props.wicket.wicket}
      </Text>
    );
  }
}

const mapStateToProps = state => ({
  wicket: state.wicket,
});

export default connect(mapStateToProps)(WicketsDisplay);
