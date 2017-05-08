import * as React from "react";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { FlatButton } from "material-ui";
import { connect } from "react-redux";
import { ModelState } from "glacier";

export default connect(
  (state: {glacier: ModelState, display: {viz: string, curAction: number}}) => ({
    viz: state.display.viz
  }),
  dispatch => ({
    onNextClick: () => dispatch({type: "ADVANCE_ACTION"})
  })
)(props => (
<MuiThemeProvider>
  <div>
    <FlatButton onClick={props.onNextClick}>Next</FlatButton>
    <div dangerouslySetInnerHTML={{__html: props.viz}}/>
  </div>
</MuiThemeProvider>
));
