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

const dispReducer = (state: DispState, action: {type: "UPDATE_VIZ_PREVIEW", payload: string}) => {
  if (!action || !state) {
    return {viz: "", curAction: -1};
  }
  if (action.type === "UPDATE_VIZ_PREVIEW") {
    return {...state, viz: action.payload};
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
const actions: g.AllActions[] = [];
let lastAction = -1;
store.subscribe(() => {
  const nextAction = store.getState().display.curAction;
  if (nextAction > lastAction && nextAction < actions.length) {
    lastAction = nextAction;
    store.dispatch(actions[nextAction]);
  }
});

fetch("/data/dji.csv").then(c => c.text()).then(async c => {
  const source = g.createCSVDataSource(store, c);
  await source.updateCache();
  const fields = g.createAddFieldsAction([
    { name: "Date", dataSource: source.id },
    { name: "High", dataSource: source.id },
    { name: "Low", dataSource: source.id }
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
    g.createSetFilterAction({type: "GT", left: fields.payload.fields[0], right: `2000-01-01`}),
    g.createUpdateMarkTypeAction("bar"),
    g.createUpdateChannelAction("y", {
      field: fields.payload.fields[1].id, type: "quantitative", axis: {
        title: "Dow Jones Indstrial Average"
      }
    }),
    g.createUpdateChannelAction("x", {
      field: fields.payload.fields[0].id, type: "ordinal", axis: { title: "Date" }
    }),
    g.createUpdateSizeAction(255, 528),
    g.createUpdateChannelAction("y", {
      field: fields.payload.fields[1].id, type: "quantitative", axis: {
        title: "Dow Jones Indstrial Average"
      },
      scale: { domain: [8000, 22000], clamp: true }
    }),
    g.createUpdateMarkTypeAction("point"),
    g.createSetFilterAction({type: "GT", left: fields.payload.fields[0], right: `1990-01-01`}),
    g.createUpdateMarkTypeAction("line"),
    g.createUpdateChannelAction("y", {
      field: fields.payload.fields[1].id, type: "quantitative", axis: {
        title: "Dow Jones Indstrial Average"
      },
      scale: { domain: [0, 22000], clamp: true }
    }),
    g.createUpdateChannelAction("x", {
      field: fields.payload.fields[0].id, type: "temporal", axis: { title: "Date" }, timeUnit: "year"
    }),
    g.createUpdateMarkTypeAction("area")
  ]);
  g.createSvgExporter(store, s => s.glacier, async (e) => {
      const data = await e.export();
      if (data.svg !== store.getState().display.viz) {
        store.dispatch({type: "UPDATE_VIZ_PREVIEW", payload: data.svg});
      }
  });
});

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")!
);
