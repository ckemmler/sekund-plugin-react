import { People } from "@/domain/People";
import PeoplesService from "@/services/PeoplesService";
import { useAppContext } from "@/state/AppContext";
import PeoplesReducer, { initialPeoplesState, PeoplesActionKind } from "@/state/PeoplesReducer";
import SekundPeopleSummary from "@/ui/peoples/SekundPeopleSummary";
import withConnectionStatus from "@/ui/withConnectionStatus";
import { EmojiSadIcon } from "@heroicons/react/solid";
import React, { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";

export type PeoplesComponentProps = {
  view: { addAppDispatch: Function };
  peoplesService: PeoplesService | undefined;
}

export const SekundPeoplesComponent = ({ peoplesService }: PeoplesComponentProps) => {
  const { appState } = useAppContext();
  const { t } = useTranslation("plugin");
  const [peoplesState, peoplesDispatch] = useReducer(PeoplesReducer, initialPeoplesState);

  const { peoples } = peoplesState;

  async function fetchPeoples() {
    if (!peoplesService) {
      peoplesService = PeoplesService.instance;
    }
    const peoples = await peoplesService.getPeoples();
    peoplesDispatch({ type: PeoplesActionKind.SetPeoples, payload: peoples });
  }

  useEffect(() => {
    if (appState.generalState === "allGood") {
      fetchPeoples();
    }
  }, [appState.generalState])

  // render

  if (peoples && peoples.length > 0) {
    return <div className="flex flex-col space-y-2px w-xl">
      {peoples.map((people: People) => {
        return (
          <SekundPeopleSummary key={people._id.toString()} people={people}></SekundPeopleSummary>
        );
      })}
    </div>
  } else return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-8">
      <div className="flex justify-center mb-2"><EmojiSadIcon className="w-6 h-6" /></div>
      <div className="text-center ">{t('plugin:noOne')}</div>
      <div className="mt-2 text-sm text-center ">{t('plugin:noOneDesc')}</div>
    </div>)

}

export default (props: PeoplesComponentProps) => withConnectionStatus(props)(SekundPeoplesComponent)