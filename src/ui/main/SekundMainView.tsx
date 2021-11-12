import i18next from "@/i18n.config";
import NoteSyncService from "@/services/NoteSyncService";
import SekundMainComponent, { MainComponentProps } from "@/ui/main/SekundMainComponent";
import SekundView from "@/ui/SekundView";
import { MAIN_VIEW_ICON, PEOPLES_VIEW_TYPE } from "@/_constants";
import React from "react";
import ReactDOM from "react-dom";

export default class SekundMainView extends SekundView {

  getViewType(): string {
    return PEOPLES_VIEW_TYPE;
  }

  getDisplayText(): string {
    return `Sekund: ${i18next.t("plugin:openPeoplesView")}`;
  }

  getIcon(): string {
    return MAIN_VIEW_ICON;
  }

  async syncDown(path: string, userId: string) {
    const note = await NoteSyncService.instance.getNoteByPath(path);
    if (note) {
      NoteSyncService.instance.syncDown(note.path, userId);
    }
  }

  unpublish() {
    NoteSyncService.instance.unpublish();
  }

  syncUp() {
    NoteSyncService.instance.syncFile();
  }

  async onOpen(): Promise<void> {
    const props = { view: this, peoplesService: undefined, syncDown: this.syncDown, syncUp: this.syncUp, unpublish: this.unpublish } as MainComponentProps;
    const InjectedTabsComponent = SekundMainComponent(props);
    ReactDOM.render(<InjectedTabsComponent />, this.containerEl.children[1]);
    this.plugin.updateOnlineStatus();
  }

}