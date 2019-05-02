import React, { Component } from 'react';
import Ball from '../Ball/Ball.js';
import OverBowledText from '../OverBowled/OverBowledText.js';
import AddWicket from '../AddWicket/AddWicket.js';
//import LinearGradient from 'react-native-linear-gradient';
import BallRemove from '../BallRemove/BallRemove.js';
//import AddWicket from '../AddWicket/AddWicket.js';
import { Container, Footer, Text } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio, Platform } from 'react-native';
import { connect } from "react-redux";

/*
Native Base StyleSheet
*/
const styles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        //padding: PixelRatio.get() === 1 ? 4 : PixelRatio.get() === 1.5 ? 6 : PixelRatio.get() === 2 ? 6 : PixelRatio.get() === 3.5 ? 8 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 6 : 10,
        padding: 10,
    },
    rowContainerSmall: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 10,
        marginTop: 'auto',
        marginBottom: 'auto',
    },
    button: {
        marginHorizontal: 8,
        backgroundColor: '#777',
    },
    add: {
        backgroundColor: '#777',
        borderRadius: 50,
        width: 60,
        height: 60,
        fontSize: 40,
    },
    largeCircle: {
      height: 80,
      width: 80,
    },
    largeIcon: {
      fontSize: 65,
      color: '#fff',
      marginTop: 'auto',
      marginRight: 'auto',
      marginBottom: 'auto',
      marginLeft: 'auto',
    },
    linearGradient: {
      flex: 1,
      paddingLeft: 15,
      paddingRight: 15,
      borderRadius: 5
    },
    rowPadding: {
      bottom: PixelRatio.get() === 2 && Platform.OS === 'ios' ? 40 : 5,
    },
    rowContainerOB: {
      bottom: PixelRatio.get() === 2 && Platform.OS === 'ios' ? 45 : 5,

    }
});



class Add extends Component {


  render() {

    return (
        <Grid>
        <Row size={2} style={styles.rowContainerOB}>
          <OverBowledText />
        </Row>
          <Row size={10} style={styles.rowPadding}>
            <Col size={1} style={styles.rowContainerSmall}>
              <BallRemove />
            </Col>
            <Col style={styles.rowContainer} size={2}>
              <Ball className="ball" />
            </Col>
            <Col size={1} style={styles.rowContainerSmall} >
              <AddWicket />
            </Col>
          </Row>
        </Grid>
    );
  }
}


export default Add;
