import React, { Component } from 'react';

import { Container, Footer, Text, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View, PixelRatio, Platform, Dimensions } from 'react-native';
import { connect } from "react-redux";
import Icon from 'react-native-vector-icons/AntDesign';
//import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { updateRuns } from '../../Reducers/runs';

import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

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
    largeCircle: {
      height: 60,
      width: 60,
    },
    largeIcon: {
      fontSize: 65,
      color: '#c471ed',
      marginTop: 'auto',
      marginRight: 'auto',
      marginBottom: 'auto',
      marginLeft: 'auto',
    },
    rowPadding: {
      bottom: PixelRatio.get() === 1.5 && Platform.OS === 'android' ? -20 :
      PixelRatio.get() === 2 && Platform.OS === 'android' ? -20 :
      PixelRatio.get() === 2 && Platform.OS === 'ios' && (height <= 568) ? -10 :
       PixelRatio.get() === 2 && Platform.OS === 'ios' ? 20 :
       PixelRatio.get() === 3 && Platform.OS === 'android' && (width >= 414) ? -20 :
        PixelRatio.get() === 3 && Platform.OS === 'android' && (width < 414) ? -20 :
        PixelRatio.get() === 3.5 && Platform.OS === 'android' ? -20 : -55,
    },
    iconStyling: {
      color: '#c471ed',
      fontSize: 40,
      marginLeft: PixelRatio.get() === 1.5 && Platform.OS === 'android' ? 5 :
      PixelRatio.get() === 2 && Platform.OS === 'android' ? 5 :
      PixelRatio.get() === 3 && Platform.OS === 'android' && (width >= 414) ? 5 :
       PixelRatio.get() === 3 && Platform.OS === 'android' && (width < 414) ? 5 :
       PixelRatio.get() === 3.5 && Platform.OS === 'android' ? 5 : 'auto',
      marginRight: 'auto',
      marginTop: 'auto',
      marginBottom: 'auto',
      justifyContent: 'center'
    }
});

class Undo extends Component {

  state = {
    runs: this.props.runs.runs || 0,
    runEvents: this.props.runs.runEvents || [],
    eventID: this.props.runs.eventID || 0,
    highestRunsPartnership: this.props.runs.highestRunsPartnership || [],
  };

  handleChange = ( runs, ball ) => {
    this.setState({ runs });
    this.setState({ ball });
  };

addUndo = () => {

  ReactNativeHapticFeedback.trigger('impactLight', true);

  let firstWicketIndex = this.props.runs.firstWicketIndex;
  let secondWicketIndex = this.props.runs.secondWicketIndex;
  let highestRunsPartnership =  this.props.runs.highestRunsPartnership;
  let totalRuns = this.props.runs.runs;
  let eventID = this.props.runs.eventID;
  let runEvents = this.props.runs.runEvents;
  console.log(runEvents);

  /*---------------------------------
  remove the last indeox of the runEvents array
  -----------------------------------*/

//find the latest object in the array
  let lastEventNumber = runEvents.length-1;
  console.log(lastEventNumber);
  let runEventsLast = runEvents[lastEventNumber];
  console.log(runEventsLast);
    //check if the last value in the array is also not the first:
  runEvents.filter(eventIDCheck => {
    console.log(eventIDCheck.eventID);
    if (eventIDCheck.eventID === 0) {
      console.log('eventID is 0 so undo nothing');
      // dont remove last item in array.
    }
    else if (runEvents[lastEventNumber]) {
      console.log(runEvents);
    runEvents.splice(-1,1);
    console.log(runEvents);
    }
    else {
    //then do nothing.
  }
});

  this.setState({
    runs: totalRuns,
    runEvents: runEvents,
    eventID: eventID,
    firstWicketIndex: firstWicketIndex,
    secondWicketIndex: secondWicketIndex,
    highestRunsPartnership: highestRunsPartnership,
  }, function () {
    const { runs, runEvents, eventID, firstWicketIndex, secondWicketIndex, highestRunsPartnership } = this.state
    this.props.dispatch(updateRuns(this.state.runs, this.state.runEvents, this.state.eventID, this.state.firstWicketIndex, this.state.secondWicketIndex, this.state.highestRunsPartnership));
  })

}

  render() {

    return (
        <Grid>
          <Row size={10} style={styles.rowPadding}>
            <Col style={styles.rowContainer} size={2}>
              <Button rounded large style={styles.largeCircle} light onPress={this.addUndo} title="Click me">
                <Icon name='back' style={styles.iconStyling} />
              </Button>
            </Col>
          </Row>
        </Grid>
    );
  }
}

//<Text style={{fontSize:30, marginLeft: 'auto', marginRight: 'auto', marginTop: 'auto', marginBottom: 'auto', justifyContent: 'center',}}>.</Text>

const mapStateToProps = state => ({
  runs: state.runs,
});

export default connect(mapStateToProps)(Undo);
