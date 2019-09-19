import React, { Component } from 'react';

class TabSwitcher extends Component {
	onChange(name) {
		this.props.onChange(name)
	}

	tabHeader() {
		var selectors = [];
		for (var i=0;i<this.props.tabs.length;i++) {
			var tab = this.props.tabs[i]

			if (this.props.selected === tab.name) {
				selectors.push(tab.name)
			} else {
				if (!tab.hide) {
					selectors.push(
					  	<button disabled={this.props.disabled} onClick={this.onChange.bind(this, tab.name)}>{tab.name}</button>
					)
				}
			}
		}
		return <div>{selectors}</div>
	}

	activeTab() {
		return this.props.tabs.find((tab) => tab.name == this.props.selected).value
	}

	render() {
		return (<div>
			{this.tabHeader()}
			{this.activeTab()}
		</div>)
	}
}

export default TabSwitcher
