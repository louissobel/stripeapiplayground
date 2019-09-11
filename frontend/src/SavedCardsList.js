import React, { Component } from 'react';

import {FormattedDate, FormattedTime} from 'react-intl'

function SavedCardsList({ customer, showUse, onUse}) {
  if (customer.card_payment_methods.length == 0) {
    return <h4>No saved cards</h4>
  } else {
    var cards = []
    customer.card_payment_methods.forEach((c) => {
      cards.push(
        <li>
          <code>{c.id}</code> — {c.card.brand} — {c.card.last4} — 
          <FormattedDate
            value={new Date(c.created * 1000)}
          /> at <FormattedTime
            value={new Date(c.created * 1000)}
          />
          {showUse &&
            <button className="inline-action-button" onClick={function() {
              onUse(c.id)
            }}>
              USE
            </button>
          }
        </li>
      )
    })
    return (
      <div>
        <h4>Saved Cards:</h4>
        <ul>
          {cards}
        </ul>
      </div>
    )
  }
}

export default SavedCardsList