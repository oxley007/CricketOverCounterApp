import React, { Component } from 'react';

import { Container, Footer, Text, Button, Icon, H1 } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio, Platform, Dimensions } from 'react-native';


/*
Native Base StyleSheet
*/
const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;
const styles = StyleSheet.create({
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 10,
    },
    rowPadding: {
      bottom: PixelRatio.get() === 2 && Platform.OS === 'ios' ? 40 : 5,
    },
    textHeader: {
      color: '#fff',
      fontWeight: '300',
      fontSize: PixelRatio.get() === 1 ? 16 : PixelRatio.get() === 1.5 ? 20 : PixelRatio.get() === 2 && (width < 414) ? 22 : PixelRatio.get() === 2 && (width === 414) ? 24 : PixelRatio.get() === 3.5 ? 24 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 20 : 24,
      },
});

class CurrentPartnership extends Component {

  render() {

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
    );
  }
}



export default CurrentPartnership;

/*findIndex not to be used but keeping incase i need to use:
const indexOfWickets = runEvents.findIndex(x => x.wicketEvent === true);
console.log(indexOfWickets);
*/
