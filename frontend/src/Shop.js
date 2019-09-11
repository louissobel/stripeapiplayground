import React, { Component } from 'react';
import {CardElement, injectStripe, Elements, StripeProvider} from 'react-stripe-elements';

import Loading, {withLoading} from './Loading';
import CheckoutForm from './CheckoutForm'
import OrderComplete from './OrderComplete'
import ZinesTable from './ZinesTable'
import SavedCardsList from './SavedCardsList'

class Shop extends Component  {
	constructor(props) {
    super(props);
    this.state = this.initialState()
  }

  initialState() {
    return {
      selectedItem: null,

      paymentIntent: null,
      actionInProgress: null,
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

  saveCard() {
    this.createSetupIntent(function () {
      this.setState({
        savingCard: true,
      })
    }.bind(this))
  }

  doAPIPostRequest(url, params, callback) {
    return fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
    .then(function(response) {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response
    })
    .then(function(response) {
      return response.json()
    })
    .then(function(data) {
      callback(data);
    })
    .catch(function(err) {
      this.setState({
        error: err,
      })
    }.bind(this))
  }

	createPaymentIntent(zineID, callback) {
    var params = {
      zine: zineID,
    }
    if (this.props.customer) {
      params.customer = this.props.customer.id
    }

    this.setState({
      actionInProgress: 'creating payment intent',
    })
    this.doAPIPostRequest('/api/create_payment_intent', params, function(data) {
      this.setState(
        {
          actionInProgress: null,
          paymentIntent: {
            id: data.id,
            clientSecret: data.client_secret,
          }
        },
        callback,
      )
    }.bind(this))
	}

	cancelPaymentIntent(id, callback) {
		this.setState({
			actionInProgress: 'canceling payment intent',
		})
    this.doAPIPostRequest('/api/cancel_payment_intent', {
      id: id,
    }, function(data) {
      this.setState(
        {
          actionInProgress: null,
          paymentIntent: null,
        },
        callback,
      )
    }.bind(this))
	}

  cancelSetupIntent(id, callback) {
    this.setState({
      actionInProgress: 'canceling setup intent',
    })
    this.doAPIPostRequest('/api/cancel_setup_intent', {
      id: id,
    }, function(data) {
      this.setState(
        {
          actionInProgress: null,
          setupIntent: null,
        },
        callback,
      )
    }.bind(this))
  }

  finalizePaymentIntent(id, callback) {
    this.setState({
      actionInProgress: 'finalizing payment intent',
    })
    this.doAPIPostRequest('/api/finalize_payment_intent', {
      id: id,
    }, function(data) {
      this.setState(
        {
          actionInProgress: null,
          fulfillmentURL: data.fulfillment_url,
        },
        callback,
      )
    }.bind(this))
  }

  createSetupIntent(callback) {
    if (!this.props.customer) {
      console.error("cannot create a setup intent without a customer!")
      return;
    }

    this.setState({
      actionInProgress: 'creating setup intent',
    })
    this.doAPIPostRequest('/api/create_setup_intent', {
      customer: this.props.customer.id,
    }, function(data) {
      this.setState(
        {
          actionInProgress: null,
          setupIntent: {
            id: data.id,
            clientSecret: data.client_secret,
          }
        },
        callback,
      )
    }.bind(this))
  }

  savePaymentMethodToCustomerFromSetupIntent(id, callback) {
    this.setState({
      actionInProgress: 'saving payment method to customer from setup intent',
    })
    this.doAPIPostRequest('/api/save_payment_method_to_customer_from_setup_intent', {
      setup_intent: id,
    }, callback)
  }

  setupSuccess(setupIntent) {
    this.savePaymentMethodToCustomerFromSetupIntent(setupIntent.id, function () {
      this.props.reload();
    }.bind(this))
  }

  cancelSetup() {
    this.setState({
      savingCard: false,
    }, function() {
      this.cancelSetupIntent(this.state.setupIntent.id, function() {})
    }.bind(this));
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
      		<div>{this.state.actionInProgress} intent</div>
	        {this.state.error.toString()}
	      </div>
	    )
  	}

  	if (this.state.actionInProgress !== null) {
  		return (
  			<div>
  				<span>{this.state.actionInProgress}</span>
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
	    	{(this.state.selectedItem === null && !this.state.savingCard) &&
		    	<div>
            {this.props.customer &&
              <div>
                <SavedCardsList
                  customer={this.props.customer}
                  showUse={false}
                  onUse={null}
                />

                <button onClick={this.saveCard.bind(this)}>
                  Save new card
                </button>
              </div>
            }

		    		<h4>Things to buy:</h4>
		    		<ZinesTable
              zines={this.props.data}
              action="Buy"
              onClick={this.createOrder.bind(this)}
            />
		    	</div>
		    }

        {this.state.savingCard &&
          <div>
            <Elements>
              <CheckoutForm
                saveCardOnly={true}
                setupIntent={this.state.setupIntent}
                onComplete={this.setupSuccess.bind(this)}
                onCancel={this.cancelSetup.bind(this)}
                customer={this.props.customer}
              />
            </Elements>
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
