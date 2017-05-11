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
  englishText: string;
  prettyJson: string;
}

const dispReducer = (
  state: DispState,
  action: {
    type: "UPDATE_VIZ_PREVIEW", payload: string
  } | {
    type: "ADVANCE_ACTION"
  } | {
    type: "UPDATE_PREVIEW_TEXT", payload: {text: string, json: string}
  }
) => {
  if (!action || !state) {
    return {viz: "", curAction: -1, englishText: "", prettyJson: ""};
  }
  if (action.type === "UPDATE_VIZ_PREVIEW") {
    return {...state, viz: action.payload};
  }
  if (action.type === "ADVANCE_ACTION") {
    return {
      ...state,
      curAction: state.curAction + 1
    };
  }
  if (action.type === "UPDATE_PREVIEW_TEXT") {
    return {
      ...state,
      englishText: action.payload.text,
      prettyJson: action.payload.json
    };
  }
  return {...state};
};
const topLevel = combineReducers<{glacier: g.ModelState, display: DispState}>({
  glacier: g.reducer, display: dispReducer
});

const store = createStore(topLevel);
const actions: {action: g.AllActions, english: string}[] = [];
let lastAction = -1;
store.subscribe(() => {
  const nextAction = store.getState().display.curAction;
  if (nextAction > lastAction && nextAction < actions.length) {
    lastAction = nextAction;
    store.dispatch(actions[nextAction].action);
    store.dispatch({type: "UPDATE_PREVIEW_TEXT", payload: {
      text: actions[nextAction].english,
      json: JSON.stringify(actions[nextAction].action, null, 4)
    }});
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
    {action: fields, english: "Select active fields"},
    {action: g.createUpdateMarkTypeAction("line"), english: "Set chart type to 'line'"},
    {action: g.createUpdateDescriptionAction("DJI v Time"), english: "Update description"},
    {action: g.createUpdateSizeAction(255, 264), english: "Set size"},
    {action: g.createAddChannelAction("x", {
      field: fields.payload.fields[0].id, type: "temporal", axis: { title: "Date" }
    }), english: "Add temporal x axis"},
    {action: g.createAddChannelAction("y", {
      field: fields.payload.fields[1].id, type: "quantitative", axis: {
        title: "Dow Jones Indstrial Average"
      }, scale: { type: "log" }
    }), english: "Add quantitative y axis"},
    {
      action: g.createSetFilterAction({type: "GT", left: fields.payload.fields[0], right: `2000-01-01`}),
      english: "Filter date to post-2000"
    },
    {action: g.createUpdateMarkTypeAction("bar"), english: "Swap chart type to 'bar'"},
    {action: g.createUpdateChannelAction("y", {
      field: fields.payload.fields[1].id, type: "quantitative", axis: {
        title: "Dow Jones Indstrial Average"
      }
    }), english: "Remove log scale on y axis"},
    {action: g.createUpdateChannelAction("x", {
      field: fields.payload.fields[0].id, type: "ordinal", axis: { title: "Date" }
    }), english: "Make x axis ordinal"},
    {action: g.createUpdateSizeAction(255, 528), english: "Widen size"},
    {action: g.createUpdateChannelAction("y", {
      field: fields.payload.fields[1].id, type: "quantitative", axis: {
        title: "Dow Jones Indstrial Average"
      },
      scale: { domain: [8000, 22000], clamp: true }
    }), english: "Adjust y domain and clamp values"},
    {action: g.createUpdateMarkTypeAction("point"), english: "Change chart type to 'point'"},
    {
      action: g.createSetFilterAction({type: "GT", left: fields.payload.fields[0], right: `1990-01-01`}),
      english: "Change filter to post-1990"
    },
    {action: g.createUpdateMarkTypeAction("line"), english: "Change chart type back to 'line'"},
    {action: g.createUpdateChannelAction("y", {
      field: fields.payload.fields[1].id, type: "quantitative", axis: {
        title: "Dow Jones Indstrial Average"
      },
      scale: { domain: [0, 22000], clamp: true }
    }), english: "Adjust domain to include 0-8000"},
    {action: g.createUpdateChannelAction("x", {
      field: fields.payload.fields[0].id, type: "temporal", axis: { title: "Date" }, timeUnit: "year"
    }), english: "Readjust x axis to be temporal and show years for time units"},
    {action: g.createUpdateMarkTypeAction("area"), english: "Change chart type to 'area'"}
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
