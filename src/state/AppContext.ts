import GlobalState from "@/state/GlobalState";
import React from "react";
import { AppAction, AppState } from "./AppReducer";

export type AppContextType = {
  appState: AppState;
  appDispatch: React.Dispatch<AppAction>;
};

new GlobalState();
const AppContext = React.createContext({} as AppContextType);

export function useAppContext() {
  return React.useContext(AppContext);
}

export default AppContext;
