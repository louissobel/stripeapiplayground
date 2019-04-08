import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

import './App.css';
import Loading from './Loading';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          SCA Zines
        </div>

        <Router>
          <Route exact path="/" component={Home} />
          <Route exact path="/sign_up" component={SignUp} />
          <Route exact path="/log_in" component={LogIn} />
          <Route exact path="/shop" component={Shop} />
          <Route path="/logged_in_as/:id" component={LoggedIn} />
        </Router>
      </div>
    );
  }
}

function Home() {
  return (
    <ul>
      <li>Either <Link to="/log_in">log in</Link></li>
      <li>Or <Link to="/sign_up">create an account</Link></li>
    </ul>
  )
}

function SignUp() {
  return (
    <div>
      <h2>Sign Up</h2>
      <form action="/create_user" method="POST">  
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
  constructor(props) {
    super(props);
    this.state = {loading: true};
  }

  componentDidMount() {
    this.getData();
  }

  getData() {
    fetch('/list_of_users', {
      credentials: 'same-origin',
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
      this.setState({loading: false, users: data, error: null})
    }.bind(this))
    .catch(function(err) {
      this.setState({loading: false, error: err})
    }.bind(this))
  }

  render() {
    if (this.state.loading) {
      return <Loading maxTicks={4} interval={250} />
    } else if (this.state.error) {
      return (
        <div class="alert-danger">
          {this.state.error.toString()}
        </div>
      )
    } else {
      var rows = [];
      this.state.users.forEach((u) => {
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
}

function LoggedIn({ match }) {
  return (
    <div>
      <h2>Welcome {match.params.id}</h2>
      <Shop customerId={match.params.id} />
    </div>
  );
}

function Shop(props) {
  return (
    <div>
      <h2>Shopping time as {props.customerId}</h2>
    </div>
  );
}


export default App;
