import React, { Component } from "react";
import {
    View,
    Text,
    StyleSheet,
    Button,
    PixelRatio
} from "react-native";
import {Header,Left,Right,Icon,Content} from 'native-base';

class LoginScreen extends Component {

/*
  static navigationOptions = {
        header: null
    }
    */

    static navigationOptions = {
      drawerIcon : ({tintColor}) => (
        <Icon name="home" style={{fontSize: 24, color: tintColor}} />
      )
    }

    render() {
        return (
            <View>
              <Header>
                <Left>
                  <Icon name="menu" onPress={() => this.props.navigation.openDrawer()}/>
                </Left>
              </Header>
            <Button title="Go To Home Screen"
                onPress={() => this.props.navigation.navigate('Home')} />
            </View>
        );
    }
}

export default LoginScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
});
