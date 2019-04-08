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
      <h4>Loading{dots}</h4>
    )
  }
}

export default Loading