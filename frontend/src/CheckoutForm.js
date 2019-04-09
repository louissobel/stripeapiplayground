import React, { Component } from 'react';
import {CardElement, injectStripe, Elements, StripeProvider} from 'react-stripe-elements';

import Loading from './Loading';

function TestCardsTable() {
	return (
    <table>
  		<tr><th>Number</th> <th>3DS Usage</th> <th>Description</th></tr>
			<tr><td>4000000000003063</td>	<td>required</td>	<td>3D Secure authentication must be completed for the payment to be successful.</td></tr>
			<tr><td>4000000000003089</td>	<td>recommended</td>	<td>3D Secure is supported and recommended but not required on this card. Payments succeed whether 3D Secure is used or not.</td></tr>
			<tr><td>4000000000003055</td>	<td>optional</td>	<td>3D Secure is supported but not required on this card. 3D Secure authentication may still be performed, but is not required. Payments succeed whether 3D Secure is used or not.</td></tr>
			<tr><td>4242424242424242</td>	<td>optional</td>	<td>3D Secure is supported for this card, but this card is not enrolled in 3D Secure. This means that if 3D Secure is invoked, the customer is not asked to authenticate. Payments succeed whether 3D Secure is invoked or not.</td></tr>
			<tr><td>378282246310005</td>	<td>not_supported</td>	<td>3D Secure is not supported on this card and cannot be invoked.</td></tr>
		</table>
	)
}

const HIDE_SUBMIT_AFTER_INTERVAL = 250;

class CheckoutForm extends Component {


	constructor(props) {
    super(props);
    this.state = {
    	error: null,
    	cardElement: null,
    	showTestCards: false,

    	// Two booleans for tracking in-progress submit — 
    	// one that goes true right away, and the other that goes
    	// true only after the submit has been ongoing for a while.
    	submitStarted: false,
    	submitGoingLong: false,
    	submitGoingLongTimeout: null,

    }
  }

  stashElement(e) {
  	this.setState({
  		cardElement: e,
  	})
  }

  showSubmit() {
  	return this.state.cardElement !== null && !this.state.submitGoingLong && !this.state.complete
  }

  setShowTestCardsTrue() {
  	this.setState({
  		showTestCards: true,
  	})
  }

  async onSubmit(ev) {
  	console.log("submit!!");
  	if (this.state.submitStarted) {
  		console.log("blocked double submit");
  		return
  	}

  	var submitGoingLongTimeout = setTimeout(function() {
  		console.log("submit going long")
  		this.setState({
  			submitGoingLong: true,
  			submitGoingLongTimeout: null,
  		})
  	}.bind(this), HIDE_SUBMIT_AFTER_INTERVAL)
  	this.setState({
    	error: null,
    	submitStarted: true,
    	submitGoingLongTimeout: submitGoingLongTimeout,
    })

		this.props.stripe.handleCardPayment(
			this.props.paymentIntent.clientSecret,
			this.state.cardElement,
		)
  	.then(function(result) {
			if (this.state.submitGoingLongTimeout) {
    		clearTimeout(this.state.submitGoingLongTimeout)
    	}
    	this.setState({
    		submitStarted: false,
	      submitGoingLong: false,
    	})
	    if (result.error) {
	    	console.log("got failure back")
	      this.setState({
	      	error: result.error.message,
	      })
	    } else {
	      this.setState({
	      	complete: true,
	      })
	      this.props.onComplete()
	    }
		}.bind(this))
	}

	render() {
		return (
			<div className="checkout-form">
				Payment Intent: <code>{this.props.paymentIntent.id}</code>

				{this.state.error &&
			    <div className="alert-danger">
            {this.state.error.toString()}
          </div>
        }
				<CardElement onReady={this.stashElement.bind(this)} />

				<div className="checkout-submit-container" >
					{this.showSubmit() &&
		      	<button className="checkout-submit" onClick={this.onSubmit.bind(this)}>Send</button>
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

export default injectStripe(CheckoutForm)