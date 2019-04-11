import React, { Component } from 'react';

import Loading from './Loading';
import ZinesTable from './ZinesTable'

function OrderComplete(props) {
  return (
    <div>
      <h3>Order Complete! <code>{props.paymentIntent.id}</code></h3>
        <ZinesTable
          zines={[props.zine]}
          action={null}
        />

        <a
         href={props.fulfillmentURL}
         >
          <button className="action-button">
            Download Zine
          </button>
         </a>

    </div>
  )
}

export default OrderComplete
