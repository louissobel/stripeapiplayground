import React, {Component} from 'react';
import {CardElement, injectStripe, Elements, StripeProvider} from 'react-stripe-elements';

class TriggerCheckout extends Component  {
  constructor(props) {
    super(props);
  }

  onClick() {
    this.props.sessionProvider(function(session) {
      this.props.stripe.redirectToCheckout({
        sessionId: session.id,
      })
    }.bind(this))
  }

  render() {
    return (
      <button onClick={this.onClick.bind(this)}>
        {this.props.label}
      </button>
    )
  }
}

export default injectStripe(TriggerCheckout)