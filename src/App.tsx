import * as React from "react";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import { FlatButton, Card, CardMedia, GridList, GridTile, CardText } from "material-ui";
import { connect } from "react-redux";
import { ModelState } from "glacier";

export default connect(
  (state: {glacier: ModelState, display: {
    viz: string, curAction: number, englishText: string, prettyJson: string
  }}) => ({
    viz: state.display.viz,
    text: state.display.englishText,
    json: state.display.prettyJson
  }),
  dispatch => ({
    onNextClick: () => dispatch({type: "ADVANCE_ACTION"})
  })
)(props => (
<MuiThemeProvider>
  <div>
    <FlatButton onClick={props.onNextClick}>Next</FlatButton><h3 style={{display: "inline-block"}}>{props.text}</h3>
    <GridList cellHeight="auto">
      <GridTile>
    <Card>
      <CardMedia>
        <div dangerouslySetInnerHTML={{__html: props.viz}}/>
      </CardMedia>
    </Card>
    </GridTile>
    <GridTile>
    <Card>
        <CardText><pre><code>{props.json}</code></pre></CardText>
    </Card>
    </GridTile>
    </GridList>
  </div>
</MuiThemeProvider>
));
