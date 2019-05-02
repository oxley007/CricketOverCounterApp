import React, { Component } from 'react';
import Stopwatch from './Stopwatch';
import AvgSecondsDisplay from './AvgSecondsDisplay';
import Reset from '../Reset/Reset';

/*
Native base and react native
*/
import { Container, Footer, H2, Text, Icon, Button, Left, Right } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, Image, PixelRatio, Platform } from 'react-native';

/*
Redux Imports:
*/
import { connect } from "react-redux";
import { updateReset } from '../../Reducers/reset';
import { updateStopwatch } from '../../Reducers/stopwatch';
import { updateOver } from '../../Reducers/over';
import { updateToggle } from '../../Reducers/toggle';


// Custom Styles
const styles = StyleSheet.create({
 colVerticleAlign: {
   marginTop: 10,
 },
 upgradeStyle: {
   fontSize: PixelRatio.get() === 1 ? 10 : PixelRatio.get() === 1.5 ? 12 : PixelRatio.get() === 2 ? 14 : 16,
 },
 imageStyle: {
   marginTop: 'auto',
   marginBottom: 'auto',
   height: PixelRatio.get() === 1.5 && Platform.OS === 'android' ? '60%' :
   PixelRatio.get() === 2 && Platform.OS === 'android' ? '60%' : '75%',
   width: 'auto',
 }

});


class HeaderIndex extends Component {
  state = {
    reset: this.props.reset.reset || 0,
    secondsElapsed: this.props.stopwatch.secondsElapsed || 0,
    laps: this.props.stopwatch.laps || [],
    lastClearedIncrementer: this.props.stopwatch.lastClearedIncrementer || null,
    incrementer: this.props.stopwatch.incrementer || null,
    avgBall: this.props.stopwatch.avgBall || [],
    avgSeconds: this.props.stopwatch.avgSeconds || 0,
    over: this.props.ball.over || 0,
    ball: this.props.ball.ball || 0,
    toggle: this.props.toggle.togglePremium || false,
  };

  incrementer = () => {
    console.log(this.state.incrementer);
    let incrementer = null;
    console.log(incrementer);
    this.setState({incrementer: incrementer});
  }

  handleChange = ( reset, stopwatch, ball, toggle ) => {
    console.log({ reset, stopwatch, ball, toggle });
    this.setState({ reset });
    this.setState({ ball });
    this.setState({ toggle });
    this.setState({ stopwatch });
  };


 resetSet = () => {
   let reset = 1;
   this.setState({reset: reset});
 }

 displaySet = () => {
   let reset = 0;
   this.setState({reset: reset}, function () {
     const { resetDisplay } = this.state;
     this.props.dispatch(updateReset( this.state.reset ));
     //this.props.addStopwatch({ secondsElapsed, laps });
   });
 }


     resetDisplaySet = () => {
       console.log('resetDisplaySet hit');
       console.log(this.props.reset.reset);
       let resetDisplay = 1;
       console.log(resetDisplay);
       this.setState({reset: resetDisplay}, function () {
         const { resetDisplay } = this.state;
         this.props.dispatch(updateReset( this.state.reset ));
         //this.props.addStopwatch({ secondsElapsed, laps });
       });
       console.log(this.props.reset.reset);
     }


 stopwatch = () => {

   /*
   First clear the timer
   */
   clearInterval(this.state.incrementer);
   this.setState({
     secondsElapsed: 0,
     laps: []
   }, function () {
     const { secondsElapsed, laps } = this.state;
     this.props.dispatch(updateStopwatch( this.state.laps, this.state.secondsElapsed ));
     //this.props.addStopwatch({ secondsElapsed, laps });
   });

   /*
   Then start the timer
   */

     this.incrementer = setInterval( () =>
         this.setState({
           secondsElapsed: this.state.secondsElapsed + 1
         },  function () {
           const { secondsElapsed } = this.state;
           this.props.dispatch(updateStopwatch( this.state.secondsElapsed ));
           //this.props.addStopwatch({ secondsElapsed });
         })
       , 1000);


 }




 headerDisplay() {
   //console.log(this.props.purchase);
   //console.log(this.props.over);
 if (this.props.toggle.togglePremium === false && this.props.ball.over >= 10) {
 return (
     <Row>
       <Col size={1}>
         <Image
          source={require('../../assets/4dot6logo-transparent.png')}
          style={styles.imageStyle}
         />
       </Col>
       <Right size={1} style={styles.colVerticleAlign}>
           <Row style={{height: 60}}>
             <Button rounded success onPress={() => this.props.navigation.navigate('Upgrade')} >
               <Text style={styles.upgradeStyle}>Upgrade</Text>
             </Button>
           </Row>
         </Right>
     </Row>
 )
}
 else {
   return (
     <Row style={{alignItems: 'center'}}>
      <Col size={1}>
      <Image
        source={require('../../assets/4dot6logo-transparent.png')}
        style={styles.imageStyle}
      />
      </Col>
       <Col>
           <Row>
             <Col>
                 <Stopwatch />
               </Col>
               <Col style={{marginTop: 16, padding: 0, margin: 0, height: 0}}>
                 <AvgSecondsDisplay style={{padding: 0, margin: 0, height: 0}} />
             </Col>
           </Row>
           <Row>
             <Text style={{fontSize: 8, height: 30, color: '#fff'}}>since last ball</Text>
           </Row>
         </Col>
     </Row>
   )
 }
 }

 /*
 <Col size={1}>
     <Row size={1} style={{height: 1, marginBottom: 0, paddingBottom: 0 }}>
       <Col size={1} style={{marginBottom: 0, height: 1}}>
           <Stopwatch />
         </Col>
         <Col size={1} style={{marginTop: 16}}>
           <AvgSecondsDisplay />
       </Col>
     </Row>
     <Row size={1}>
       <Text style={{fontSize: 8, height: 30, color: '#fff'}}>since last ball</Text>
     </Row>
   </Col>
   */

 static navigationOptions = {
   drawerIcon : ({tintColor}) => (
     <Icon name="home" style={{fontSize: 24, color: tintColor}} />
   )
 }

 render() {
   return (
       <Grid >
         {this.headerDisplay()}
       </Grid>

   );
 }
}

const mapStateToProps = state => ({
  ball: state.ball,
  over: state.over,
  reset: state.reset,
  stopwatch: state.stopwatch,
  toggle: state.toggle,
});

export default connect(mapStateToProps)(HeaderIndex);
