import React, { Component } from 'react';
import Stopwatch from './Stopwatch';
import AvgSecondsDisplay from './AvgSecondsDisplay';
import Reset from './Reset';

/*
Native base and react native
*/
import { Container, Footer, H2, Text, Icon, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View } from 'react-native';

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
    purchase: this.props.toggle.toggle || false,
  };

  incrementer = () => {
    console.log(this.state.incrementer);
    let incrementer = null;
    console.log(incrementer);
    this.setState({incrementer: incrementer});
  }

  handleChange = ( reset, stopwatch, ball, toggle ) => {
    console.log({ reset, stopwatch, ball, toggle });
    this.setState({ reset, stopwatch, ball, toggle });
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
   if (this.props.reset.reset === 1) {
   return (
     <Row>
       <Col size={1}>
         <Text>Are you sure?</Text>
       </Col>
       <Col size={1}>
         <Reset />
       </Col>
       <Col size={1}>
         <Button light onPress={this.displaySet}>
           <Text>Cancel</Text>
         </Button>
       </Col>
     </Row>
   )
 }
 else if (this.props.reset.reset === 0 && this.props.toggle.toggle === true && this.props.ball.over >= 10) {
 return (
     <Row>
       <Col size={1}>
         <Button rounded danger onPress={this.resetSet()}>
           <Text>Reset</Text>
         </Button>
       </Col>
       <Col size={1}>
         <Text style={{textAlign: 'center', marginTop: 'auto', marginBottom: 'auto', color: '#fff'}}>4DOT6</Text>
       </Col>
       <Col size={1} style={styles.colVerticleAlign}>
           <Row style={{height: 28}}>
             <Button rounded success >
               <Text>Upgrade</Text>
             </Button>
           </Row>
         </Col>
     </Row>
 )
}
 else {
   return (
     <Row>
       <Col size={1}>
         <Button rounded danger onPress={this.resetDisplaySet}>
           <Text>Reset</Text>
         </Button>
       </Col>
       <Col size={1}>
         <Text style={{textAlign: 'center', marginTop: 'auto', marginBottom: 'auto', color: '#fff'}}>4DOT6</Text>
       </Col>
       <Col size={1} style={{}}>
           <Row style={{height: 28}}>
             <Col>
                 <Stopwatch />
               </Col>
               <Col style={{marginTop: 16}}>
                 <AvgSecondsDisplay />
             </Col>
           </Row>
           <Row style={{}}>
             <Text style={{fontSize: 8, height: 30, color: '#fff'}}>since last ball</Text>
           </Row>
         </Col>
     </Row>
   )
 }
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
