import { PlaygroundPage } from "./playground/PlaygroundPage";
import { home, playground } from "./routes";
import React = require("react");

export class App extends React.Component {
	render() {

	    if (home.isActive) {
			return <PlaygroundPage />;
		}
		return <>Page does not exist</>;
	}
}
