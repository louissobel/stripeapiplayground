import React from 'react';

import Currency from 'react-currency-formatter';

function ZinesTable(props) {
	var rows = [];
	props.zines.forEach((z) => {
		rows.push(
			<tr>
			  <td className="zine-icon">{z.icon}</td>
  			<td>{z.author}</td>
  			<td>{z.title}</td>
  			<td>{z.edition}</td>
  			<td>
          <Currency
            quantity={z.price_amount}
            currency={z.price_currency}
          />
        </td>
  			<td>
  				{props.action !== null &&
	  				<button onClick={function() {
	  					props.onClick(z.id)
	  				}}>
	  					{props.action}
	  				</button>
	  			}
  			</td>
  		</tr>
		)
	})
	return (
		 <table>
  		<tr>
  			<th></th>
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

export default ZinesTable