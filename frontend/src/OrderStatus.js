import React, { Component } from 'react';
import ReactJson from 'react-json-view'
import { Link } from 'react-router-dom'

import Loading from './Loading';
import ZinesTable from './ZinesTable'

function OrderStatus(props) {
  return (
    <div>
      <h3>Order Status <code>{props.paymentIntentID}</code></h3>
        <h4><code>{props.status}</code></h4>
        {props.status == "requires_payment_method" && props.rawPaymentIntent.last_payment_error && 
          <div>
            <div class="alert-danger panel">
              {props.rawPaymentIntent.last_payment_error.message}
              <br />
              (<code>{props.rawPaymentIntent.last_payment_error.code}</code>)

              <Link to={retryRoute(props.rawPaymentIntent)} className="link-action-button action-button">
                Try Again With Another PaymentMethod
              </Link>
            </div>

          </div>
        }


        <ZinesTable
          showOnly={props.zineID}
          action={null}
        />

        {props.fulfillmentURL &&
          <a
           href={props.fulfillmentURL}
           >
            <button className="action-button">
              Download Zine
            </button>
           </a>
        }

        <hr />
        <h4>Raw PaymentIntent:</h4>
        <ReactJson
          src={props.rawPaymentIntent}
          displayDataTypes={false}
          name="paymentIntent"
          shouldCollapse={(field) => {
            return (
              field.name == "transfer_data"
              ||
              field.name == "charges"
              ||
              field.name == "last_payment_error"
              ||
              field.name == "last_payment_error"
              ||
              field.name == "shipping"
              ||
              field.name == "customer"
            )
          }}
        />

    </div>
  )
}

function retryRoute(paymentIntent) {
  var route;
  if (paymentIntent.customer) {
    route = `/logged_in_as/${paymentIntent.customer.id}`
  } else {
    route= "/shop"
  }
  return route + `?reenteringCheckout=true&payment_intent=${paymentIntent.id}`
}

export default OrderStatus
