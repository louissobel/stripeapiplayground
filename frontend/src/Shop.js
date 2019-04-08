import React, { Component } from 'react';
import {CardElement, injectStripe, Elements, StripeProvider} from 'react-stripe-elements';

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
    			price_amount: 500,
    			price_currency: 'eur',
    		},
    		{
    			id: "2",
    			author: "Louis",
    			title: "Dublin Weather Report",
    			edition: "March 2019",
    			price_amount: 500,
    			price_currency: 'eur',
    		},
    		{
    			id: "3",
    			author: "Louis",
    			title: "Dublin Weather Report",
    			edition: "February 2019",
    			price_amount: 500,
    			price_currency: 'eur',
    		},
    	],
    	selectedItem: null,
    };
  }

  loadZineById(id) {
  	return this.state.zines.find((z) => {
  		return z.id == id
  	})
  }

  toggleItem(id) {
  	if (this.state.selectedItem === null) {
	  	this.setState({
	  		selectedItem: id,
	  	})
	  } else {
	  	this.setState({
	  		selectedItem: null,
	  	})
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

  render() {
	  return (
	    <div>
	    	{this.state.selectedItem === null &&
		    	<div>
		    		<h4>Things to buy:</h4>
		    		{this.zinesTable(this.state.zines)}
		    	</div>
		    }

	    	{this.state.selectedItem !== null &&
		      <StripeProvider apiKey="pk_test_CUWEAiWmHR3muLpWWDLlmWCD00nfdS9Wmq">
		      	<div>

			      	{this.zinesTable([this.loadZineById(this.state.selectedItem)])}

			      	<Elements>
			      		<CheckoutForm />
		        	</Elements>
	        	</div>
	        </StripeProvider>
      	}
	    </div>
	  );
	}
}

class RawCheckoutForm extends Component {
	async submit(ev) {
		console.log(ev)
	}

	render() {
		return (
			<div className="checkout-form">
				<CardElement />
	      <button className="checkout-submit" onClick={this.submit.bind(this)}>Send</button>
	    </div>
		)
	}
}
const CheckoutForm = injectStripe(RawCheckoutForm);

export default Shop;