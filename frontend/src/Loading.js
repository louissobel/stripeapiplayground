import React, { Component } from 'react';

class Loading extends Component {
  constructor(props) {
    super(props);
    this.state = {tick: 1}
  }

  incrementTick() {
    var nextTicks = this.state.tick + 1;
    if (nextTicks > this.props.maxTicks) {
      nextTicks = 1
    }
    this.setState({tick: nextTicks})
  }

  componentDidMount() {
    this.interval = setInterval(this.incrementTick.bind(this), this.props.interval)
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    var dots = Array(this.state.tick).fill(".")

    return (
      <h4>
        {!this.props.dotsOnly && "Loading"}{dots}</h4>
    )
  }
}

export function withLoading(WrappedComponent, url, fetchOptions) {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        loading: true
      };
    }

    componentDidMount() {
      this.getData()
    }

    getData() {
      fetch(url, fetchOptions)
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
        this.setState({loading: false, data: data, error: null})
      }.bind(this))
      .catch(function(err) {
        this.setState({loading: false, error: err})
      }.bind(this))
    }

    reload() {
      this.setState({
        loading: true,
      })
      this.getData()
    }

    render() {
      if (this.state.loading) {
        return <Loading maxTicks={4} interval={250} />
      } else {
        if (this.state.error) {
          return (
            <div class="alert-danger">
              {this.state.error.toString()}
            </div>
          )
        } else {
          return <WrappedComponent reload={this.reload.bind(this)} data={this.state.data} {... this.props} />;
        }
      };
    }
  };
}

export default Loading