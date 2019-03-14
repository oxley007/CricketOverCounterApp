import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    PixelRatio,
    Image,
    Platform
} from "react-native";
import {Header,Left,Right,Icon,Content,Grid,Row,Col,Container,H1,Button,Footer} from 'native-base';
import LinearGradient from 'react-native-linear-gradient';
import Reset from '../HeaderComponents/Reset';

/*
Redux Imports:
*/
import { connect } from "react-redux";
import { updateSettings } from '../../Reducers/settings';

console.log('settings 1');

class Settings extends Component {


  state = {
    settings: this.props.settings.settings || 33,
  };

  handleChange = settings => {
    this.setState({ settings });
  };



/*
  resetDisplaySet = () => {
    console.log('resetDisplaySet hit');
    console.log(this.props.settings.settings);
    let resetDisplay = 1;
    console.log(resetDisplay);
    this.setState({reset: resetDisplay}, function () {
      const { resetDisplay } = this.state;
      this.props.dispatch(updateReset( this.state.reset ));
      //this.props.addStopwatch({ secondsElapsed, laps });
    });
    console.log(this.props.reset.reset);
  }

  displaySet = () => {
    let resetDisplay = 0;
    this.setState({reset: resetDisplay}, function () {
      const { resetDisplay } = this.state;
      this.props.dispatch(updateReset( this.state.reset ));
      //this.props.addStopwatch({ secondsElapsed, laps });
    });
  }

  displayBack = () => {
    let resetDisplay = 0;
    this.setState({reset: resetDisplay}
      , function () {
        console.log(this.props.reset.reset  + ' reset');
        const { resetDisplay } = this.state
        this.props.dispatch(updateReset(this.state.reset))
      });

      this.props.navigation.navigate('Home')
  }

  resetDisplay() {
    //console.log(this.props.purchase);
    //console.log(this.props.over);
    if (this.props.reset.reset === 1) {
    return (
      <Col style={styles.container}>
            <Row style={styles.rowPadding}><H1 style={styles.textHeader}>Are you sure?</H1></Row>
            <Row><Text style={styles.textDesc}>All values will be set to 0</Text></Row>
            <Row style={styles.rowPadding}>
              <Reset />
            </Row>
            <Row style={styles.rowPadding}>
            <Button rounded large light style={styles.largeButton} title="Cancel" onPress={this.displaySet}>
              <Text style={styles.buttonTextBack}>Cancel</Text>
            </Button>
        </Row>
      </Col>
    )
  }
  else if (this.props.reset.reset === 2) {
  return (
    <Col style={styles.container}>
          <Row style={styles.rowPadding}><H1 style={styles.textHeader}>Reset complete</H1></Row>
          <Row><Text style={styles.textDesc}>All values have been set to 0</Text></Row>
          <Row style={styles.rowPadding}>
          <Button rounded large light style={styles.largeButton} onPress={this.displayBack}>
            <Text style={styles.buttonTextBack}><Icon name='ios-arrow-back' style={styles.buttonTextBack} /> Back to over counter</Text>
          </Button>
      </Row>
    </Col>
  )
}
  else {
    return (
      <Col style={styles.container}>
            <Row style={styles.rowPadding}><H1 style={styles.textHeader}>Reset the over counter?</H1></Row>
            <Row><Text style={styles.textDesc}>Clear all data to start a new innings</Text></Row>
            <Row style={styles.rowPadding}>

            <Button rounded large light style={styles.largeButton} title="Reset" onPress={this.resetDisplaySet}>
              <Text style={styles.buttonTextBack}><Icon name='md-arrow-dropright' style={styles.buttonTextBack} />  Reset</Text>
            </Button>
        </Row>
      </Col>
    )
  }
  }

  */

/*
  static navigationOptions = {
        header: null
    }
    */

    static navigationOptions = {
      drawerIcon : ({tintColor}) => (
        <Icon name="sync" style={{fontSize: 24, color: tintColor}} />
      )
    }

    render() {
      console.log(this.props.settings.settings);
        return (
            <Container>
              <Header style={styles.headerStyle}>
                <Left size={1}>
                  <Icon name="menu" onPress={() => this.props.navigation.openDrawer()} style={{color: '#fff', paddingLeft: 20, marginTop: 'auto', marginBottom: 'auto' }} />
                </Left>
                <Col size={1} style={ styles.logoStylingCol }>
                <Image
                 source={require('../../assets/4dot6logo-transparent.png')}
                 style={{ height: '100%', width: 'auto', justifyContent: 'center', alignItems: 'center', resizeMode: 'contain' }}
                />
                </Col>
                <Right size={1} style={styles.colVerticleAlign}>
                  </Right>
              </Header>
              <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 1}}
              locations={[0,0.9,0.9]} colors={['#12c2e9', '#c471ed']} style={styles.linearGradient}>
              <Content style={{ flex: 1, width: '100%'}}>
                <Grid>
                  <Row>
                    <H1>
                  {this.props.settings.settings}
                    </H1>
                    <Text>Hello!</Text>
                  </Row>
                </Grid>
              </Content>
              <Footer style={{ height: 100, backgroundColor: 'transparent', borderTopWidth: 0, backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 }}>
              <Button rounded large warning style={styles.largeButton}
                  onPress={this.displayBack} >
                  <Text style={styles.buttonTextBack}><Icon name='ios-arrow-back' style={styles.buttonTextBack} /> Back to over counter</Text>
                </Button>
                <H1 style={{color:'#fff'}}>
              {this.props.settings.settings}
                </H1>
              </Footer>
              </LinearGradient>
            </Container>
        );
    }
}


const mapStateToProps = state => ({
  settings: state.settings,
});


export default connect(mapStateToProps)(Settings);
//export default Settings;

// Custom Styles
const styles = StyleSheet.create({
    container: {
        //flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
      elevation: 0,
      shadowOpacity: 0,
    },
    buttonText: {
      fontSize: PixelRatio.get() === 1 ? 28 : PixelRatio.get() === 1.5 ? 32 : PixelRatio.get() === 2 ? 36 : 40,
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
    rowPadding :{
      paddingTop: 20,
    },
    logoStylingCol :{
      marginBottom: 5,
      marginTop: 5,
      marginLeft: Platform.OS === 'android' ? '17%' : 0,
      justifyContent: 'center'
    },
    headerStyle: {
      height: PixelRatio.get() === 1 ? 45 : PixelRatio.get() === 1.5 ? 50 : PixelRatio.get() === 2 ? 75 : PixelRatio.get() === 3.5 ? 60 : PixelRatio.get() === 3 && Platform.OS === 'android' ? 60 : 75,
      backgroundColor: '#12c2e9',
    },
});
