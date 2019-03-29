import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    Platform,
} from "react-native";
import {Header,Left,Right,Icon,Content,Grid,Row,Col,Container,H1,Button,Footer} from 'native-base';
import LinearGradient from 'react-native-linear-gradient';

//Redux imports
import { connect } from "react-redux";
import { toggle } from '../../Reducers/toggle';


class Iap extends Component {

  state = {
    toggle: this.props.toggle.togglePremium || true,
  };


  handleChange = ( toggle ) => {
    this.setState({ toggle });
  };

    render() {
        return (
                <Col style={styles.container} size={1}>
                    <Row>
                    <H1 style={{marginBottom: 20}}>Upgrade purchased</H1>
                    </Row>
                    <Row>
                      <Text>You currently have all the features for trhe entire innings. 4dot6 thanks you for upgrading to pro.</Text>
                  </Row>
                </Col>
        );
    }
}

const mapStateToProps = state => ({
  toggle: state.toggle,
});

export default connect(mapStateToProps)(Iap);

// Custom Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    linearGradient: {
      flex: 1,
      paddingLeft: 15,
      paddingRight: 15,
      borderRadius: 5
    },
    textHeader: {
      color: '#fff',
      alignItems: 'center',
      justifyContent: 'center'
    },
    textDesc: {
      color: '#eee',
      fontWeight: '100',
    },
    textHeaderNumber: {
      color: '#fff',
      fontSize: 40,
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
    largeButton: {
      width: '100%',
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    largeButtonGreen: {
      width: '100%',
      backgroundColor: '#28a745',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
    },
    buttonText: {
      fontSize: 40,
      color: '#c471ed',
      marginTop: 'auto',
      marginRight: 'auto',
      marginBottom: 'auto',
      marginLeft: 'auto',
      fontWeight: '200',
    },
    buttonTextBack: {
      fontSize: 20,
      color: '#c471ed',
      marginTop: 'auto',
      marginRight: 'auto',
      marginBottom: 'auto',
      marginLeft: 'auto',
      fontWeight: '200',
    },
    buttonTextBackWhite: {
      fontSize: 20,
      color: '#fff',
      marginTop: 'auto',
      marginRight: 'auto',
      marginBottom: 'auto',
      marginLeft: 'auto',
      fontWeight: '200',
    },
    rowPadding :{
      paddingTop: 20,
    },
    btn: {
    height: 50,
    width: 240,
    alignSelf: 'center',
    backgroundColor: '#00c40f',
    borderRadius: 0,
    borderWidth: 0,
  },
  txt: {
    fontSize: 12,
    color: 'white',
  },
  textHeader: {
    color: '#000',
    fontWeight: '400',
    fontSize: 20,
  },
  textDesc: {
    color: '#000',
    fontWeight: '200',
    fontSize: 16,
    paddingBottom: 20,
  },
  textHeaderNumber: {
    color: '#fff',
    fontSize: 40,
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
});
