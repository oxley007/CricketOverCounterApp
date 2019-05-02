import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    PixelRatio,
    Image,
    Platform,
    Linking,
} from "react-native";
import {Header,Left,Right,Icon,Content,Grid,Row,Col,Container,H1,Button,Footer} from 'native-base';
import LinearGradient from 'react-native-linear-gradient';


class FeedbackHome extends Component {


    thresholdInput = () => {
      /*
      const backslash = '\\'
      console.log(backslash);
      const appleUrl = 'itms-apps://itunes.apple.com/app/id'+backslash+'1448840478?action=write-review&mt=8'
      console.log(appleUrl);
      */
      if (Platform.OS === 'ios') {
      return (
        <Row style={styles.rowPadding}>
        <Button rounded large light style={styles.largeButton} title="Feedback" onPress={ ()=>{ Linking.openURL('https://itunes.apple.com/nz/app/cricket-over-and-ball-counter/id1448840478?mt=8')}}>
          <Text style={styles.buttonTextBack}><Icon name='md-arrow-dropright' style={styles.buttonTextBack} />  Place feedback</Text>
        </Button>
    </Row>

      )
    }
    else {
      <Row style={styles.rowPadding}>
      <Button rounded large light style={styles.largeButton} title="Feedback" onPress={ ()=>{ Linking.openURL('https://play.google.com/store/apps/details?id=com.cricketovercounterapp')}}>
        <Text style={styles.buttonTextBack}><Icon name='md-arrow-dropright' style={styles.buttonTextBack} />  Place feedback</Text>
      </Button>
  </Row>
    }
    }

    static navigationOptions = {
      drawerIcon : ({tintColor}) => (
        <Icon name="md-add" style={{fontSize: 24, color: tintColor}} />
      )
    }

    render() {
        return (
            <Container>
              <Header style={styles.headerStyle}>
                <Left size={1}>
                  <Icon name="menu" onPress={() => this.props.navigation.openDrawer()} style={{color: '#fff', paddingLeft: 20, marginTop: 'auto', marginBottom: 'auto' }} />
                </Left>
                <Col size={2} style={ styles.logoStylingCol }>
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
                <Col style={styles.container}>
                      <Row style={styles.rowPadding}><H1 style={styles.textHeader}>Place feedback</H1></Row>
                      <Row><Text style={styles.textDesc}>We would love to hear from anyone using the app about improvements, general comments, or bugs. We look forward to hearing from you.</Text></Row>
                      {this.thresholdInput()}
                  <Row style={styles.rowPadding}>
                  <Button rounded large light style={styles.largeButton} title="Comments-bugs" onPress={ ()=>{ Linking.openURL('https://www.4dot6digital.com/contact-4dot6')}}>
                    <Text style={styles.buttonTextBack}><Icon name='md-add' style={styles.buttonTextBack} />  Comments / Bugs</Text>
                  </Button>
              </Row>
                </Col>
                </Grid>
              </Content>
              <Footer style={{ height: 100, backgroundColor: 'transparent', borderTopWidth: 0, backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 }}>
              <Button rounded large warning style={styles.largeButton}
                  onPress={() => this.props.navigation.navigate('Home')} >
                  <Text style={styles.buttonTextBack}><Icon name='ios-arrow-back' style={styles.buttonTextBack} /> Back to run counter</Text>
                </Button>
              </Footer>
              </LinearGradient>
            </Container>
        );
    }
}


export default FeedbackHome;

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
