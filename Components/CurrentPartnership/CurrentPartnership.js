import React, { Component } from 'react';

/*
Redux imports
*/
import { connect } from "react-redux";
import { addPurchase } from "../../Actions/index";
import { addOver } from "../../Actions/index";

/*
Native base and react native
*/
import { Container, Footer, H2, H1, Text, Icon, Button } from 'native-base';
import { Col, Row, Grid } from 'react-native-easy-grid';
import { StyleSheet, View } from 'react-native';

/*
Redux constants
*/
const mapDispatchToProps = dispatch => {
  return {
    addPurchase: purchase => dispatch(addPurchase(purchase)),
    addOver: over => dispatch(addOver(over))
  };
};

const mapStateToProps = state => {
  return { over: state.over.over, ball: state.over.ball, purchase: state.purchase.purchase };
};

// Custom Styles
const styles = StyleSheet.create({
  textHeader: {
    color: '#fff',
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
  }
});

class currentPartnership extends Component {
  constructor(props) {
    super(props);
      this.state = {
        over: 0,
        ball: 0,
        purchase: false
      };

    this.currentPartnershipDispay = this.currentPartnershipDispay.bind(this);

  }

  componentWillMount() {
    const { purchase, over } = this.state;
    this.props.addPurchase({ purchase });
    this.props.addOver({ over });
  }

currentPartnershipDispay() {
  if (this.props.purchase === true && this.props.over >= 10) {
  return (
  <Row>
    <Col size={4} style={styles.colVerticleAlign}>
      <Button rounded success >
        <Text>Upgrade</Text>
      </Button>
    </Col>
    <Col size={8} style={styles.colCenter}>
      <Row><H1 style={styles.textHeader}>Upgrade to pro</H1></Row>
      <Row><Text style={styles.textDesc}>to show current partnership and over timer for the entire innings</Text></Row>
    </Col>
  </Row>
)
}
else {
  return (
  <Row>
    <Col size={9}>
      <Row><H1 style={styles.textHeader}>Current Partnership:</H1></Row>
      <Row><Text style={styles.textDesc}>The current partnership in overs</Text></Row>
    </Col>
    <Col size={3} style={styles.colCenter}>
      <Row>
        <H1 style={styles.textHeaderNumber}>{this.props.currentPartnership}</H1>
      </Row>
      <Row>
        <Text style={styles.textDesc}>Overs</Text>
      </Row>
    </Col>
  </Row>
)
}
}

  render() {
    return (
      <Grid>
        {this.currentPartnershipDispay()}
      </Grid>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(currentPartnership);
