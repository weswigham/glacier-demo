import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "./App";
import { Provider } from "react-redux";
import { combineReducers, createStore } from "redux";
import * as g from "glacier";
import "./index.css";

import injectTapEventPlugin = require("react-tap-event-plugin");

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

export interface DispState {
  viz: string;
  curAction: number;
}

const dispReducer = (action: {type: "UPDATE_VIZ_PREVIEW", payload: string}, state: DispState) => {
  if (!action || !state) {
    return {viz: "", curAction: 0};
  }
  if (action.type === "UPDATE_VIZ_PREVIEW") {
    return {viz: action.payload};
  }
  if (action.type === "ADVANCE_ACTION") {
    return {...state, curAction: state.curAction + 1};
  }
  return {...state};
};
const topLevel = combineReducers<{glacier: g.ModelState, display: DispState}>({
  glacier: g.reducer, display: dispReducer
});

const store = createStore(topLevel);
g.createSvgExporter(store, s => s.glacier, async (e) => {
  const data = await e.export();
  store.dispatch({type: "UPDATE_VIZ_PREVIEW", payload: data.svg});
});

const actions: g.AllActions[] = [];
store.subscribe(() => {
  const nextAction = store.getState().display.curAction;
  if (nextAction <= actions.length) {
    store.dispatch(actions[nextAction]);
  }
});

fetch("/data/dji.csv").then(c => c.text()).then(c => {
  const source = g.createCSVDataSource(store, c);
  const fields = g.createAddFieldsAction([
    { name: "Date", dataSource: source.id }, { name: "High", dataSource: source.id }
  ]);
  actions.push(...[
    fields,
    g.createUpdateMarkTypeAction("line"),
    g.createUpdateDescriptionAction("DJI v Time"),
    g.createUpdateSizeAction(255, 264),
    g.createAddChannelAction("x", {
      field: fields.payload.fields[0].id, type: "temporal", axis: { title: "Date" }
    }),
    g.createAddChannelAction("y", {
      field: fields.payload.fields[1].id, type: "quantitative", axis: {
        title: "Dow Jones Indstrial Average"
      }, scale: { type: "log" }
    }),
    g.createUpdateMarkTypeAction("bar"),
    g.createSetFilterAction({type: "GT", left: fields.payload.fields[0].id, right: +new Date(2000, 1)})
  ]);
});


ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")!
);
