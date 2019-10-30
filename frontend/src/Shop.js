import React, { Component } from 'react';
import queryString from 'query-string';
import {Elements} from 'react-stripe-elements';
import { Redirect } from 'react-router-dom'

import Loading from './Loading';
import CheckoutForm from './CheckoutForm'
import ZinesTable from './ZinesTable'
import SavedPaymentMethodsList from './SavedPaymentMethodsList'
import TriggerCheckout from './TriggerCheckout'

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

      error: null,
      checkoutDone: false,

      reenteringCheckout: false,
    };
  }

  loadZineById(id) {
  	return this.props.data.find((z) => {
  		return z.id === id
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

  savePaymentMethod() {
    this.createSetupIntent(function () {
      this.setState({
        savingPaymentMethod: true,
      })
    }.bind(this))
  }

  savePaymentMethodUsingCheckout() {
    this.createCheckoutSetupSession(function (session) {
      console.log(session)
    })
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
            paymentMethodTypes: data.payment_method_types,
          }
        },
        callback,
      )
    }.bind(this))
	}

  loadPaymentIntent(id, callback) {
    this.doAPIPostRequest('/api/load_payment_intent', {id: id}, callback)
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

  mabyeFinalizePaymentIntent(id, callback) {
    this.setState({
      actionInProgress: 'maybe finalizing payment intent',
    })
    this.doAPIPostRequest('/api/maybe_finalize_payment_intent', {
      id: id,
    }, function(data) {
      this.setState(
        {
          actionInProgress: null,
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
            paymentMethodTypes: data.payment_method_types,
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

  provideCheckoutSetupSession(callback) {
    if (!this.props.customer) {
      console.error("cannot create a setup mode checkout session without a customer")
      return;
    }

    this.setState({
      actionInProgress: 'creating checkout setup session',
    })
    this.doAPIPostRequest('/api/create_checkout_setup_session', {
      customer: this.props.customer.id,
    }, callback)
  }

  setupSuccess(setupIntent) {
    this.savePaymentMethodToCustomerFromSetupIntent(setupIntent.id, function () {
      this.props.reload();
    }.bind(this))
  }

  cancelSetup() {
    this.setState({
      savingPaymentMethod: false,
    }, function() {
      this.cancelSetupIntent(this.state.setupIntent.id, function() {})
    }.bind(this));
  }

	checkoutSuccess() {
    this.mabyeFinalizePaymentIntent(this.state.paymentIntent.id, function() {
      this.setState({
        checkoutDone: true,
      })
    }.bind(this))
	}

  reenterCheckout(paymentIntentID, paymentMethod, action) {
    this.setState({
      reenteringCheckout: true,
      actionInProgress: action,
      initialPaymentMethod: paymentMethod,
    }, function() {
      this.loadPaymentIntent(paymentIntentID, function(paymentIntent) {
        this.setState({
          paymentIntent: {
            id: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            paymentMethodTypes: paymentIntent.payment_method_types,
          },
          selectedItem: paymentIntent.metadata.zine,
        }, function () {
          if (paymentIntent.status === "succeeded") {
            this.mabyeFinalizePaymentIntent(this.state.paymentIntent.id, function() {
              this.setState({
                checkoutDone: true,
              })
            }.bind(this))
          } else {
            this.setState({
              redirectError: paymentIntent.last_payment_error.message,
              actionInProgress: null,
            })
          }
        }.bind(this))
      }.bind(this))
    })
  }

  render() {
    const query = queryString.parse(this.props.location.search);
    if (query.reenteringCheckout && !this.state.reenteringCheckout) {
      this.reenterCheckout(query.payment_intent, query.reenterAction)
      return ""
    }

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
      return <Redirect to={`/order/${this.state.paymentIntent.id}`} />
  	}

	  return (
	    <div>
	    	{(this.state.selectedItem === null && !this.state.savingPaymentMethod) &&
		    	<div>
            {this.props.customer &&
              <div>
                <SavedPaymentMethodsList
                  customer={this.props.customer}
                  showUse={false}
                  onUse={null}
                />

                <button onClick={this.savePaymentMethod.bind(this)}>
                  Save new payment method
                </button>
                or...
                <Elements>
                  <TriggerCheckout
                    label="Save payment method using checkout"
                    sessionProvider={this.provideCheckoutSetupSession.bind(this)}
                  />
                </Elements>
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

        {this.state.savingPaymentMethod &&
          <div>
            <Elements>
              <CheckoutForm
                savePaymentMethodOnly={true}
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
                  zineID={this.state.selectedItem}
			      			paymentIntent={this.state.paymentIntent}
			      			onComplete={this.checkoutSuccess.bind(this)}
                  onCancel={this.cancelOrder.bind(this)}
                  customer={this.props.customer}
                  redirectError={this.state.redirectError}
			      		/>
		        	</Elements>
	        	</div>
      	}
	    </div>
	  );
	}
}

export default Shop;
