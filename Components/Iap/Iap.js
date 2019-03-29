import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    Platform,
    PixelRatio,
} from "react-native";
import {Header,Left,Right,Icon,Content,Grid,Row,Col,Container,H1,Button,Footer} from 'native-base';
import LinearGradient from 'react-native-linear-gradient';

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
    'android.test.purchased', // test purchse from https://developer.android.com/google/play/billing/billing_testing#billing-testing-static
  ],
});


class Iap extends Component {
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
    toggle: this.props.toggle.togglePremium || false,
  };


  handleChange = ( toggle ) => {
    this.setState({ toggle });
  };

  async componentDidMount() {
    try {
      const result = await RNIap.initConnection();
      console.log('result', result);
    } catch (err) {
      console.warn(err.code, err.message);
    }
    this.getItems();
  }

  //after purcahse to to the finish transaction page.
  goToNext = () => {
    this.props.navigation.navigate('Logout', {
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
  } catch (err) {
    console.warn(err.code, err.message);
    const subscription = RNIap.addAdditionalSuccessPurchaseListenerIOS(async (purchase) => {
      this.setState({ receipt: purchase.transactionReceipt }, () => this.goToNext());
      subscription.remove();
    });
  }
}

  //***needs tested!!***
  getPurchases = async() => {
  try {
    console.log('get hit, and when??');
    const purchases = await RNIap.getAvailablePurchases();
    let restoredTitles = '';
    let coins = CoinStore.getCount();
    purchases.forEach(purchase => {
      if (purchase.productId == '4dot6OVER01') {
        this.setState({ togglePremium: true });
        restoredTitles += 'Premium Version';
      }
      else if (purchase.productId == 'android.test.purchased') {
        console.log(purchase.productId);
        this.setState({ togglePremium: true });
        restoredTitles += 'Premium Version';
      }
    })
    Alert.alert('Restore Successful', 'You successfully restored the following purchases: ' + restoredTitles);
  } catch(err) {
    console.warn(err); // standardized err.code and err.message available
    Alert.alert(err.message);
  }
}


    static navigationOptions = {
      drawerIcon : ({tintColor}) => (
        <Icon name="ios-star-outline" style={{fontSize: 24, color: tintColor}} />
      )
    }

    getPrice = (priceString) => {
      const price = JSON.parse(priceString);
      //return (<H1 style={styles.textHeaderNumber}>${price}</H1>)
      return(<Text style={styles.buttonTextBackWhite}>${price}</Text>)
    }

    getTitle = (titleString) => {

      const title = JSON.parse(titleString);
      return(<Row><H1 style={styles.textHeader}>{title}</H1></Row>)
    }

    getDescription = (descString) => {

      const desc = JSON.parse(descString);
      return(<Row><Text style={styles.textDesc}>{desc}</Text></Row>)
    }

    render() {
      const purchase = this.props.toggle.togglePremium;
      const { productList, receipt, availableItemsMessage } = this.state;
      const receipt100 = receipt.substring(0, 100);
        return (

                <Col size={1}>



                      <Row><Text style={styles.textHeader}>Cricket Over Counter Premium</Text></Row>
                      <Row><Text style={styles.textDesc}>Cricket Umpire Over and Ball Counter upgrade to premium to allow all features for the entire innings!</Text></Row>


                  {
                    productList.map((product, i) => {
                      console.log(product);
                      return (
                        <Row key={i} style={{
                          flexDirection: 'column', alignItems: 'center',
                        }}>

                          <Button rounded large warning style={styles.largeButtonGreen}
                              onPress={() => this.buyItem(product.productId)} >
                              {this.getPrice(JSON.stringify(product.price))}
                            </Button>
                        </Row>
                  );
              })
            }


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
      justifyContent: 'center',
      lineHeight: 0,
    },
    textDesc: {
      color: '#eee',
      fontWeight: '100',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
    },
    rowPadding: {
      paddingBottom: 40,
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
      fontSize: 30,
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
      textAlign: 'center',
      fontWeight: '200',
      marginTop: 'auto',
      marginRight: 'auto',
      marginBottom: 'auto',
      marginLeft: 'auto',
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
  colFontSizeLarge: {
    fontSize: 100,
  }
});

/*
<Row>
  <Button
    onPress={this.getItems}
    activeOpacity={0.5}
    style={styles.btn}
    textStyle={styles.txt}
    ><Text>Get available purchases</Text>
  </Button>

  <Text style={{ margin: 5, fontSize: 15, alignSelf: 'center' }} >{availableItemsMessage} </Text>

  <Text style={{ margin: 5, fontSize: 9, alignSelf: 'center' }} >{receipt100}</Text>

  <Button
    onPress={() => this.getItems()}
    activeOpacity={0.5}
    style={styles.btn}
    textStyle={styles.txt}
  ><Text>Get Products ({productList.length})</Text></Button>
  </Row>

  */

  /*
  code to call title and description from app stores

  <Row>{this.getTitle(JSON.stringify(product.title))}</Row>
  <Row>{this.getDescription(JSON.stringify(product.description))}</Row>

  */
