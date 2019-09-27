import React, { Component } from 'react';

import {FormattedDate, FormattedTime} from 'react-intl'

function SavedPaymentMethodsList({ customer, showUse, onUse, limitUseToTypes}) {
  if (customer.payment_methods.length == 0) {
    return <h4>No saved PaymentMethods</h4>
  } else {
    var paymentMethods = []
    customer.payment_methods.forEach((pm) => {
      paymentMethods.push(
        <li>
          <code>{pm.id}</code> — {paymentMethodDetails(pm)} — 
          <FormattedDate
            value={new Date(pm.created * 1000)}
          /> at <FormattedTime
            value={new Date(pm.created * 1000)}
          />
          {showUse && limitUseToTypes.includes(pm.type) &&
            <button className="inline-action-button" onClick={function() {
              onUse(pm.type, pm.id)
            }}>
              USE
            </button>
          }
        </li>
      )
    })
    return (
      <div>
        <h4>Saved PaymentMethods:</h4>
        <ul>
          {paymentMethods}
        </ul>
      </div>
    )
  }
}

function paymentMethodDetails(paymentMethod) {
  if (paymentMethod.type === "card") {
    return `${paymentMethod.card.brand} — ${paymentMethod.card.last4}`
  } else if (paymentMethod.type === "bacs_debit") {
    return `Bacs Debit — ****${paymentMethod.bacs_debit.last4}`
  } else {
    throw new Error(`unhandled  payment method type: ${paymentMethod.type}`)
  }
}

export default SavedPaymentMethodsList