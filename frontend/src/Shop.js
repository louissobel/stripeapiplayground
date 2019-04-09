import React, { Component } from 'react';
import {CardElement, injectStripe, Elements, StripeProvider} from 'react-stripe-elements';

import Loading from './Loading';
import CheckoutForm from './CheckoutForm'

class Shop extends Component  {
	constructor(props) {
    super(props);
    this.state = {
    	zines: [
    		{
    			id: "1",
    			author: "Louis",
    			title: "Dublin Weather Report",
    			edition: "April 2019",
    			price_amount: 504,
    			price_currency: 'eur',
    		},
    		{
    			id: "2",
    			author: "Louis",
    			title: "Dublin Weather Report",
    			edition: "March 2019",
    			price_amount: 503,
    			price_currency: 'eur',
    		},
    		{
    			id: "3",
    			author: "Louis",
    			title: "Dublin Weather Report",
    			edition: "February 2019",
    			price_amount: 502,
    			price_currency: 'eur',
    		},
    	],
    	selectedItem: null,

    	paymentIntent: null,
    	paymentIntentActionInProgress: null,

    	cardElement: null,

    	error: null,
    	checkoutError: null,
    };
  }

  loadZineById(id) {
  	return this.state.zines.find((z) => {
  		return z.id == id
  	})
  }

  toggleItem(id) {
  	if (this.state.selectedItem === null) {
	  	this.createPaymentIntent(id, function() {
		  	this.setState({
		  		selectedItem: id,
		  	})
	  	}.bind(this));
	  } else {
	  	this.cancelPaymentIntent(this.state.paymentIntent.id, function() {
		  	this.setState({
		  		selectedItem: null,
		  	})
	  	}.bind(this));
	  }
  }

	zinesTable(zines) {
		var rows = [];
		zines.forEach((z) => {
			rows.push(
				<tr>
	  			<td>{z.author}</td>
	  			<td>{z.title}</td>
	  			<td>{z.edition}</td>
	  			<td>{z.price_amount}, {z.price_currency}</td>
	  			<td>
	  				<button onClick={this.toggleItem.bind(this, z.id)}>
	  					{this.state.selectedItem === null ? "Buy" : "Clear"}
	  				</button>
	  			</td>
	  		</tr>
			)
		})
		return (
			 <table>
	  		<tr>
	  			<th>Author</th>
	  			<th>Zine</th>
	  			<th>Edition</th>
	  			<th>Price</th>
	  			<th></th>
	  		</tr>
	  		{rows}

	  	</table>
		)
	}

	createPaymentIntent(zineID, callback) {
		this.setState({
			paymentIntentActionInProgress: 'creating',
		})
		// TODO: make this create them for a user!!
		var zine = this.loadZineById(zineID)
		var params = {
			amount: zine.price_amount,
			currency: zine.price_currency,
		}
		fetch('/create_payment_intent', {
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
		fetch('/cancel_payment_intent', {
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

	checkoutSuccess() {
		this.setState({
			checkoutDone: true,
		})
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
  		return (
  			<h3>Checkout, success, thank you for your purchase</h3>
  		)
  	}

	  return (
	    <div>
	    	{this.state.selectedItem === null &&
		    	<div>
		    		<h4>Things to buy:</h4>
		    		{this.zinesTable(this.state.zines)}
		    	</div>
		    }

	    	{this.state.selectedItem !== null &&
		      
		      	<div>
			      	{this.zinesTable([this.loadZineById(this.state.selectedItem)])}
			      	<Elements>
			      		<CheckoutForm
			      			paymentIntent={this.state.paymentIntent}
			      			onComplete={this.checkoutSuccess.bind(this)}
			      		/>
		        	</Elements>
	        	</div>
      	}
	    </div>
	  );
	}
}

export default Shop;