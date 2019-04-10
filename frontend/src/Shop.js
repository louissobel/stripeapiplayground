import React, { Component } from 'react';
import {CardElement, injectStripe, Elements, StripeProvider} from 'react-stripe-elements';

import Loading, {withLoading} from './Loading';
import CheckoutForm from './CheckoutForm'
import OrderComplete from './OrderComplete'
import ZinesTable from './ZinesTable'

class Shop extends Component  {
	constructor(props) {
    super(props);
    this.state = this.initialState()
  }

  initialState() {
    return {
      selectedItem: null,

      paymentIntent: null,
      paymentIntentActionInProgress: null,
      fulfillmentURL: null,

      error: null,
      checkoutDone: false,
    };
  }

  loadZineById(id) {
  	return this.props.data.find((z) => {
  		return z.id == id
  	})
  }

  createOrder(id) {
    this.createPaymentIntent(id, function() {
      this.setState({
        selectedItem: id,
      })
    }.bind(this));
  }

  cancelOrder() {
    this.setState({
      selectedItem: null,
    }, function() {
      this.cancelPaymentIntent(this.state.paymentIntent.id, function() {})
    }.bind(this));
  }

	createPaymentIntent(zineID, callback) {
		this.setState({
			paymentIntentActionInProgress: 'creating',
		})
		var params = {
			zine: zineID,
		}
    if (this.props.customer) {
      params.customer = this.props.customer.id
    }

		fetch('/api/create_payment_intent', {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
		})
		.then(function(response) {
		  if (!response.ok) {
          throw Error(response.statusText);
      }
      return response;
		})
		.then(function(response) {
			return response.json()
		})
		.then(function(data) {
			this.setState(
				{
					paymentIntentActionInProgress: null,
					paymentIntent: {
						id: data.id,
						clientSecret: data.client_secret,
					}
				},
				callback,
			)
		}.bind(this))
		.catch(function(err) {
			this.setState({
				error: err,
			})
		}.bind(this))
	}

	cancelPaymentIntent(id, callback) {
		this.setState({
			paymentIntentActionInProgress: 'canceling',
		})
		var params = {
			id: id,
		}
		fetch('/api/cancel_payment_intent', {
			method: 'POST',
			credentials: 'same-origin',
			headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
		})
		.then(function(response) {
		  if (!response.ok) {
          throw Error(response.statusText);
      }
      return response;
		})
		.then(function(response) {
			return response.json()
		})
		.then(function(data) {
			this.setState(
				{
					paymentIntentActionInProgress: null,
					paymentIntent: null,
				},
				callback,
			)
		}.bind(this))
		.catch(function(err) {
			this.setState({
				error: err,
			})
		}.bind(this))
	}

  finalizePaymentIntent(id, callback) {
    this.setState({
      paymentIntentActionInProgress: 'finalizing',
    })
    var params = {
      id: id,
    }
    fetch('/api/finalize_payment_intent', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    })
    .then(function(response) {
      if (!response.ok) {
          throw Error(response.statusText);
      }
      return response;
    })
    .then(function(response) {
      return response.json()
    })
    .then(function(data) {
      this.setState(
        {
          paymentIntentActionInProgress: null,
          fulfillmentURL: data.fulfillment_url,
        },
        callback,
      )
    }.bind(this))
    .catch(function(err) {
      this.setState({
        error: err,
      })
    }.bind(this))
  }

	checkoutSuccess() {
    this.finalizePaymentIntent(this.state.paymentIntent.id, function() {
      this.setState({
        checkoutDone: true,
      })
    }.bind(this))
	}

  render() {
  	if (this.state.error != null) {
      return (
      	<div class="alert-danger">
      		<div>{this.state.paymentIntentActionInProgress} payment intent</div>
	        {this.state.error.toString()}
	      </div>
	    )
  	}

  	if (this.state.paymentIntentActionInProgress !== null) {
  		return (
  			<div>
  				<span>{this.state.paymentIntentActionInProgress} payment intent</span>
  				<Loading maxTicks={4} interval={250} />
  			</div>
  		)
  	}

  	if (this.state.checkoutDone) {
  		return <OrderComplete
        zine={this.loadZineById(this.state.selectedItem)}
        paymentIntent={this.state.paymentIntent}
        fulfillmentURL={this.state.fulfillmentURL}
      />
  	}

	  return (
	    <div>
	    	{this.state.selectedItem === null &&
		    	<div>
		    		<h4>Things to buy:</h4>
		    		<ZinesTable
              zines={this.props.data}
              action="Buy"
              onClick={this.createOrder.bind(this)}
            />
		    	</div>
		    }

	    	{this.state.selectedItem !== null &&
		      	<div>
			      	<Elements>
			      		<CheckoutForm
                  zine={this.loadZineById(this.state.selectedItem)}
			      			paymentIntent={this.state.paymentIntent}
			      			onComplete={this.checkoutSuccess.bind(this)}
                  onCancel={this.cancelOrder.bind(this)}
                  customer={this.props.customer}
			      		/>
		        	</Elements>
	        	</div>
      	}
	    </div>
	  );
	}
}

export default withLoading(Shop, "/api/zines");
