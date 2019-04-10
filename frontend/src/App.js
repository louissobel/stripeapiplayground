import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import {StripeProvider} from 'react-stripe-elements';

import './App.css';
import Loading, {withLoading} from './Loading';
import Shop from './Shop';
import {IntlProvider} from 'react-intl';

class App extends Component {
  render() {
    return (
      <div className="App">
        <StripeProvider apiKey="pk_test_CUWEAiWmHR3muLpWWDLlmWCD00nfdS9Wmq" betas={['card_payment_method_beta_1']}>
          <IntlProvider>
            <Router>
              <div className="App-header">
                <span>SCA Zines — </span>
                <Link to="/">home</Link>
              </div>


              <Route exact path="/" component={Home} />
              <Route exact path="/sign_up" component={SignUp} />
              <Route exact path="/log_in" component={
                withLoading(LogIn, '/api/list_of_users', {
                  credentials: 'same-origin',
                })
              } />
              <Route exact path="/shop" component={Shop} />
              <Route path="/logged_in_as/:id" component={LoggedIn} />
            </Router>
          </IntlProvider>
        </StripeProvider>
      </div>
    );
  }
}

function Home() {
  return (
    <ul>
      <li>Either <Link to="/log_in">log in</Link></li>
      <li>Or <Link to="/sign_up">create an account</Link></li>
      <li>Or <Link to="/shop">just shop</Link></li>
    </ul>
  )
}

function SignUp() {
  return (
    <div>
      <h2>Sign Up</h2>
      <form action="/api/create_user" method="POST">  
        <label>
          Username:
          <input type="text" name="username" />
        </label>
        <input type="submit" value="Submit" />
      </form>
    </div>
  )
}

class LogIn extends Component {
  render() {
    var rows = [];
    this.props.data.forEach((u) => {
      rows.push(
        <tr>
          <td>{u.metadata.username}</td>
          <td>
            <Link to={`/logged_in_as/${u.id}`}>
              {u.id}
            </Link>
          </td>
        </tr>
      )
    })
    return (
      <div>
        <table>
          <th>
            <td>Username</td>
            <td>Id</td>
          </th>
          {rows}
        </table>
      </div>
    )
  }
}

function LoggedIn({ match }) {
  const ShopWithCustomer = withLoading(function(props) {
    var {data, ...rest} = props;
    return <Shop customer={data} {...rest} />
  }, `/api/customer_data?id=${match.params.id}`)

  return (
    <div>
      <h2>Welcome {match.params.id}</h2>
      <ShopWithCustomer />
    </div>
  );
}

export default App;
