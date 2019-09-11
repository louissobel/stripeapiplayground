import React, { Component } from 'react';
import {CardElement, injectStripe, Elements, StripeProvider} from 'react-stripe-elements';

class CardForm extends Component {
	constructor(props) {
		super(props)
    this.state = {
      cardElement: null,
      showTestCards: false,
    }
	}

  stashElement(e) {
    this.setState({
      cardElement: e,
    })
  }

  render() {
    return (
      <div>
        <CardElement onReady={this.stashElement.bind(this)} />

        <div className="checkout-submit-container" >
          {this.showSubmit() &&
            <button className="action-button" onClick={this.onSubmit.bind(this)}>Send</button>
          }

          {this.state.submitGoingLong && 
            <Loading maxTicks={6} interval={150} dotsOnly={true} />
          }
        </div>

        <div>
          {this.state.showTestCards ? (
            <div>
              <h3>Test Cards</h3>
              <TestCardsTable />
            </div>
          ) : (
            <button onClick={this.setShowTestCardsTrue.bind(this)}>Show Test Cards</button>
          )}
        </div>
      </div>
    )
  }
}