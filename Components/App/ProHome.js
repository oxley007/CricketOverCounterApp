import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    Platform,
    Image,
    PixelRatio,
} from "react-native";
import {Header,Left,Right,Icon,Content,Grid,Row,Col,Container,H1,Button,Footer} from 'native-base';
import LinearGradient from 'react-native-linear-gradient';
import Iap from '../Iap/Iap.js';
import IapTrue from '../Iap/IapTrue.js';

//Redux imports
import { connect } from "react-redux";
import { toggle } from '../../Reducers/toggle';

//In-app Purchase import
import * as RNIap from 'react-native-iap';

const itemSkus = Platform.select({
  ios: [
    '4dot6OVER01', // from APp Store Connect > Cricket Over and Ball Counter > Features > In-App Purchases > Product ID
  ],
  android: [
    'premium.4dot6.cricketovercounter', // test purchse from https://developer.android.com/google/play/billing/billing_testing#billing-testing-static
  ],
});




class ProHome extends Component {
  constructor(props) {
    console.log(itemSkus);
    super(props);

    this.state = {
      productList: [],
      receipt: '',
      availableItemsMessage: '',
    };
  }

  state = {
    toggle: this.props.toggle.toggle || '',
  };

  handleChange = toggle => {
    this.setState({ toggle });
  };

  async componentDidMount() {
    try {
      const result = await RNIap.initConnection();
      console.log('result', result);
    } catch (err) {
      console.warn(err.code, err.message);
    }
  }

  //Need to setup a new page 'second'.
  goToNext = () => {
    this.props.navigation.navigate('Second', {
      receipt: this.state.receipt,
    });
  }

  getItems = async() => {
    try {
      console.log(itemSkus);
      const products = await RNIap.getProducts(itemSkus);
      // const products = await RNIap.getSubscriptions(itemSkus);
      console.log('Products', products);
      this.setState({ productList: products });
    } catch (err) {
      console.warn(err.code, err.message);
    }
  }

  buyItem = async(sku) => {
  console.info('buyItem: ' + sku);
  // const purchase = await RNIap.buyProduct(sku);
  // const products = await RNIap.buySubscription(sku);
  // const purchase = await RNIap.buyProductWithoutFinishTransaction(sku);
  try {
    const purchase: any = await RNIap.buyProduct(sku);
    this.setState({ receipt: purchase.transactionReceipt }, () => this.goToNext());
    this.setState({
      toggle: true,
    }, function () {
      //console.log(this.state.over  + ' over');
      const { toggle } = this.state
      this.props.dispatch(toggle(this.state.toggle));
    })
  } catch (err) {
    console.warn(err.code, err.message);
    const subscription = RNIap.addAdditionalSuccessPurchaseListenerIOS(async (purchase) => {
      this.setState({ receipt: purchase.transactionReceipt }, () => this.goToNext());
      subscription.remove();
    });
  }
}

  getPurchases = async() => {
  try {
    const purchases = await RNIap.getAvailablePurchases();
    let restoredTitles = '';
    let coins = CoinStore.getCount();
    purchases.forEach(purchase => {
      if (purchase.productId == '4dot6OVER01') {
        this.setState({ premium: true });
        restoredTitles += 'Premium Version';
      }
    })
    Alert.alert('Restore Successful', 'You successfully restored the following purchases: ' + restoredTitles);
  } catch(err) {
    console.warn(err); // standardized err.code and err.message available
    Alert.alert(err.message);
  }
}

hasPurchased = () => {
  if (this.props.toggle.toggle === true)
  {
    return (<IapTrue />)
  }
  else {
    return (<Iap navigation={this.props.navigation} />)
  }
}

    static navigationOptions = {
      drawerIcon : ({tintColor}) => (
        <Icon name="ios-star-outline" style={{fontSize: 24, color: tintColor}} />
      )
    }

    render() {
      const purchase = this.props.toggle.toggle;
      console.log(purchase);
      const { productList, receipt, availableItemsMessage } = this.state;
      const receipt100 = receipt.substring(0, 100);
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
                <Grid style={styles.gridStyle}>

                    <Row style={{marginBottom: 20}}>
                      <Image source={require('../../assets/4dot6logo-light-blue-bg.png')} style={{height: 120, width: 120, borderRadius: 60}} />
                    </Row>

                  {this.hasPurchased()}
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

const mapStateToProps = state => ({
  toggle: state.toggle,
});

export default connect(mapStateToProps)(ProHome);

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
  gridStyle: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: PixelRatio.get() === 1 ? 15 : PixelRatio.get() === 1.5 ? 18 : PixelRatio.get() === 2 ? 24 : 30,
    alignItems: 'center',
    marginTop: 20
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
