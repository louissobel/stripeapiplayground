import React from 'react';

import Loading, {withLoading} from './Loading';
import {FormattedNumber} from 'react-intl'

function ZinesTable(props) {
	var rows = [];
	props.data.forEach((z) => {
    if (props.showOnly && props.showOnly != z.id) {
      return;
    }

		rows.push(
			<tr>
			  <td className="zine-icon">{z.icon}</td>
  			<td>{z.author} (<code>{z.account}</code>)</td>
  			<td>{z.title}</td>
  			<td>{z.edition}</td>
  			<td>
          <FormattedNumber
            value={z.price_amount / 100.0}
            style="currency"
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

export default withLoading(ZinesTable, "/api/zines")