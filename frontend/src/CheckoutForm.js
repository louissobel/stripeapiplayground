import React, { Component } from 'react';
import {CardElement, injectStripe, Elements, StripeProvider, IdealBankElement, IbanElement} from 'react-stripe-elements';

import {FormattedDate, FormattedTime} from 'react-intl'

import Loading from './Loading';
import ZinesTable from './ZinesTable';
import SavedCardsList from './SavedCardsList';
import TabSwitcher from './TabSwitcher';


function TestDataTable({paymentMethod}) {
	return (
    <div>
    {paymentMethod == 'card' &&
      <table>
    		<tr><th>Number</th> <th>3DS Usage</th> <th>Description</th></tr>
  			<tr><td>4000000000003063</td>	<td>required</td>	<td>3D Secure authentication must be completed for the payment to be successful.</td></tr>
  			<tr><td>4000000000003089</td>	<td>recommended</td>	<td>3D Secure is supported and recommended but not required on this card. Payments succeed whether 3D Secure is used or not.</td></tr>
  			<tr><td>4000000000003055</td>	<td>optional</td>	<td>3D Secure is supported but not required on this card. 3D Secure authentication may still be performed, but is not required. Payments succeed whether 3D Secure is used or not.</td></tr>
  			<tr><td>4242424242424242</td>	<td>optional</td>	<td>3D Secure is supported for this card, but this card is not enrolled in 3D Secure. This means that if 3D Secure is invoked, the customer is not asked to authenticate. Payments succeed whether 3D Secure is invoked or not.</td></tr>
  			<tr><td>378282246310005</td>	<td>not_supported</td>	<td>3D Secure is not supported on this card and cannot be invoked.</td></tr>
        <tr><td>4000002500003155</td> <td>required on setup</td> <td>This test card requires authentication for one-time payments. However, if you set up this card using the Setup Intents API and use the saved card for subsequent payments, no further authentication is needed.</td></tr>
  		</table>
    }

    {paymentMethod == 'ideal' &&
      <span><i>No Test Data</i></span>
    }

    {paymentMethod == 'sepa_debit' &&
      <table>
        <tr><th>IBAN</th> <th>Description</th></tr>
        <tr><td>DE89370400440532013000</td> <td>The charge status transitions from pending to succeeded.</td></tr>
        <tr><td>DE62370400440532013001</td> <td>The charge status transitions from pending to failed.</td></tr>
        <tr><td>DE35370400440532013002</td> <td>The charge status transitions from pending to succeeded, but a dispute is immediately created.</td></tr>
      </table>
    }
    </div>
	)
}

const HIDE_SUBMIT_AFTER_INTERVAL = 250;

class CheckoutForm extends Component {


	constructor(props) {
    super(props);
    this.state = {
    	error: props.redirectError || null,
    	cardElement: null,
      idealElement: null,
    	showTestData: false,

      saveCard: false,

    	// Two booleans for tracking in-progress submit — 
    	// one that goes true right away, and the other that goes
    	// true only after the submit has been ongoing for a while.
    	submitStarted: false,
    	submitGoingLong: false,
    	submitGoingLongTimeout: null,

      selectedPaymentMethod: 'card',

      customerName: "",
      customerEmail: "",
    }
  }

  stashCardElement(e) {
  	this.setState({
  		cardElement: e,
  	})
  }

  stashIdealElement(e) {
    this.setState({
      idealElement: e,
    })
  }

  stashIbanElement(e) {
    this.setState({
      ibanElement: e,
    })
  }

  showSubmit() {
    var elementReady = (
      this.state.selectedPaymentMethod == 'card' && this.state.cardElement !== null
      ||
      this.state.selectedPaymentMethod == 'ideal' && this.state.idealElement !== null
      ||
      this.state.selectedPaymentMethod == 'sepa_debit' && this.state.ibanElement !== null
    )
  	return elementReady && !this.state.submitGoingLong && !this.state.complete
  }

  setShowTestData() {
  	this.setState({
  		showTestData: true,
  	})
  }

  startSubmit() {
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
  }

  finishCardPromise(cpp) {
    cpp.then(function(result) {
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
        this.props.onComplete(result)
      }
    }.bind(this))
  }

  onSubmit(ev) {
    this.startSubmit()

    if (this.state.selectedPaymentMethod == 'card') {
      if (this.props.saveCardOnly) {
        this.setupCard()
      } else {
        this.useCard();
      }
    } else if (this.state.selectedPaymentMethod == 'ideal') {
      this.useIdeal();
    } else if (this.state.selectedPaymentMethod == 'sepa_debit') {
      this.useSepaDebit();
    }else {
      throw new Error("unknown payment method" + this.state.selectedPaymentMethod)
    }
  }

  useCard() {
		var cardPaymentPromise = this.props.stripe.handleCardPayment(
			this.props.paymentIntent.clientSecret,
			this.state.cardElement,
      {
        save_payment_method: this.state.saveCard,
      }
		)

    this.finishCardPromise(cardPaymentPromise)
	}

  setupCard() {
    var cardSetupPromise = this.props.stripe.handleCardSetup(
      this.props.setupIntent.clientSecret,
      this.state.cardElement,
    ).then(function (result) {
      return result.setupIntent
    })

    this.finishCardPromise(cardSetupPromise)
  }

  onReuseCard(id) {
    this.startSubmit()

    var cardPaymentPromise = this.props.stripe.handleCardPayment(
      this.props.paymentIntent.clientSecret,
      {
        payment_method: id,
      }
    )

    this.finishCardPromise(cardPaymentPromise)
  }

  useIdeal() {
    var returnPath = (this.props.customer ? '/logged_in_as/' + this.props.customer.id : '/shop') + '?reenteringCheckout=true&reenterAction=finshing%20redirect'
    var returnURL = 'http://localhost:3000' + returnPath 
    var idealPaymentPromise = this.props.stripe.handleIdealPayment(
      this.props.paymentIntent.clientSecret,
      this.state.idealElement,
      {
        return_url: returnURL,
      }
    );

    this.finishCardPromise(idealPaymentPromise)
  }

  useSepaDebit() {
    var sepaDebitPaymentPromise = this.props.stripe.handleSepaDebitPayment(
      this.props.paymentIntent.clientSecret,
      this.state.ibanElement,
      {
        payment_method_data: {
          billing_details: {
            name: this.state.customerName,
            email: this.state.customerEmail,
          }
        }
      }
    )
    this.finishCardPromise(sepaDebitPaymentPromise)
  }

  handleSaveCardChange(event) {
    const target = event.target;
    this.setState({
      saveCard: target.checked,
    })
  }

  handlePaymentMethodChange(paymentMethod) {
    this.setState({
      selectedPaymentMethod: paymentMethod,
      error: null,
    })
  }

  handleCustomerNameChange(e) {
    this.setState({
      customerName: e.target.value,
    })
  }

  handleCustomerEmailChange(e) {
    this.setState({
      customerEmail: e.target.value,
    })
  }

  renderSepaDebitForm(onElementReady) {
    return (<div>
      <div>
        <label for="name">
          Name
        </label>
        <input
          name="name"
          value={this.state.customerName}
          onChange={this.handleCustomerNameChange.bind(this)}
          placeholder="Oscar Pops"
        />
      </div>
      <div>
        <label for="email">
          Email
        </label>
        <input
          name="email"
          value={this.state.customerEmail}
          onChange={this.handleCustomerEmailChange.bind(this)}
          placeholder="oscar@pops.com"
        />
      </div>
      <IbanElement supportedCountries={['SEPA']} onReady={onElementReady} />
    </div>)
  }

	render() {
		return (
			<div className="checkout-form">
        {!this.props.saveCardOnly &&
          <ZinesTable
            showOnly={this.props.zineID}
            action="Cancel"
            onClick={this.props.onCancel}
          />
        }
        {this.props.saveCardOnly &&
          <button
            onClick={this.props.onCancel}
          >
            Cancel
          </button>
        }

        {this.props.paymentIntent &&
          <div>
  				  Payment Intent: <code>{this.props.paymentIntent.id}</code>
          </div>
        }

        {this.props.setupIntent &&
          <div>
            Setup Intent: <code>{this.props.setupIntent.id}</code>
          </div>
        }

				{this.state.error &&
			    <div className="alert-danger">
            {this.state.error.toString()}
          </div>
        }
        {(this.props.customer && !this.props.saveCardOnly) &&
          <SavedCardsList
            customer={this.props.customer}
            showUse={this.showSubmit()}
            onUse={this.onReuseCard.bind(this)}
          />
        }

        <div class="payment-method-switcher">
          <TabSwitcher
            disabled={this.state.submitStarted}
            tabs={[
              {
                name: 'card',
                value: <CardElement onReady={this.stashCardElement.bind(this)} />,
              },
              {
                name: 'ideal',
                value: <IdealBankElement onReady={this.stashIdealElement.bind(this)} />,
                hide: this.props.saveCardOnly,
              },
              {
                name: 'sepa_debit',
                value: this.renderSepaDebitForm(this.stashIbanElement.bind(this)),
                hide: this.props.saveCardOnly,
              },
            ]}
            selected={this.state.selectedPaymentMethod}
            onChange={this.handlePaymentMethodChange.bind(this)}
          />
        </div>

        {(this.props.customer && !this.props.saveCardOnly && this.state.selectedPaymentMethod == 'card') &&
          <div>
            <input
              type="checkbox"
              checked={this.state.saveCard}
              onChange={this.handleSaveCardChange.bind(this)}
            />
            Save Card ({this.state.saveCard ? "true" : "false"})
          </div>
        }

				<div className="checkout-submit-container" >
					{this.showSubmit() &&
		      	<button className="action-button" onClick={this.onSubmit.bind(this)}>
              {this.props.saveCardOnly ? "Save" : "Submit"}
            </button>
		      }

		      {this.state.submitGoingLong && 
		      	<Loading maxTicks={6} interval={150} dotsOnly={true} />
		      }
		    </div>

      	<div>
      		{this.state.showTestData ? (
	      		<div>
	      			<h3>Test Data</h3>
	      			<TestDataTable paymentMethod={this.state.selectedPaymentMethod} />
	      		</div>
	      	) : (
	      		<button onClick={this.setShowTestData.bind(this)}>Show Test Data</button>
	      	)}
      	</div>

	    </div>
		)
	}
}

export default injectStripe(CheckoutForm)
