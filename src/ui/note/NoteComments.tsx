import { NoteComment } from "@/domain/NoteComment";
import { getAvatar } from "@/helpers/avatars";
import { isVisible } from "@/helpers/visibility";
import EventsWatcherService from "@/services/EventsWatcherService";
import NotesService from "@/services/NotesService";
import { useAppContext } from "@/state/AppContext";
import { AppActionKind } from "@/state/AppReducer";
import EventsContext, { useEventsContext } from "@/state/EventsContext";
import { EventsActionKind } from "@/state/EventsReducer";
import GlobalState from "@/state/GlobalState";
import NoteCommentComponent from "@/ui/note/NoteCommentComponent";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import TextareaAutosize from "react-textarea-autosize";

export default function NoteComments() {
  const { appState, appDispatch } = useAppContext();
  const { t } = useTranslation(["common", "plugin"]);
  const { userProfile, plugin, remoteNote } = appState;

  const guestImage = userProfile?.image;
  const guestName = userProfile?.name;
  const guestEmail = userProfile?.email;
  const sendButton = useRef<HTMLButtonElement>(null);
  const [areaText, setAreaText] = useState("");
  const { eventsState, eventsDispatch } = useEventsContext();

  const [localComments, setLocalComments] = useState<Array<NoteComment>>(remoteNote?.comments || [])
  // let gen: AsyncGenerator<Realm.Services.MongoDB.ChangeEvent<any>, any, unknown>;


  // useEffect(() => {
  //   (async () => {
  //     const { remoteNote } = appState;
  //     if (appState.plugin && appState.plugin.user && remoteNote) {
  //       console.log("putting note watcher in place...");
  //       const notes = appState.plugin.user.mongoClient("mongodb-atlas").db(appState.plugin.settings.subdomain).collection("notes");
  //       if (notes) {
  //         gen = notes.watch([{ $match: { _id: remoteNote._id } }]);
  //         for await (const change of gen) {
  //           // from this moment on, changes to this filtered collection
  //           // will call `handleNoteChange` until the call to
  //           // `gen.return(undefined)` when this component gets unmounted.
  //           // This means that even though we may have switched note, the
  //           // state could be corrupted with an old note, so we have
  //           // to check that the note update is for the current one (see
  //           // below).
  //           const docKey = (change as any).documentKey;
  //           handleNoteChange(change, docKey._id as ObjectID);
  //         }
  //       }
  //     }
  //   })()
  //   return () => {
  //     if (gen) {
  //       gen.return(undefined);
  //     }
  //   }
  // }, []);
  // async function handleNoteChange(change: Realm.Services.MongoDB.ChangeEvent<any>, changedNoteId: ObjectID) {
  //   // check if this note change is for the current note and not for an old
  //   // one. 
  //   const currentRemoteNote = GlobalState.instance.appState.remoteNote;
  //   if (currentRemoteNote && currentRemoteNote._id.equals(changedNoteId)) {
  //     const updtNote = await NotesService.instance.getNote(currentRemoteNote._id.toString())
  //     appDispatch({ type: AppActionKind.SetRemoteNote, payload: { ...updtNote } })
  //   }
  // }

  useEffect(() => {
    if (EventsWatcherService.instance) {
      EventsWatcherService.instance.watchEvents(eventsDispatch);
    }
  }, [])

  useEffect(() => {
    if (!eventsState.event || !remoteNote) {
      return;
    }
    const evt = eventsState.event;
    switch (evt.type) {
      case "addComment":
      case "removeComment":
      case "editComment":
        (async () => {
          const currentRemoteNote = GlobalState.instance.appState.remoteNote;
          if (currentRemoteNote && evt.data.noteId.equals(currentRemoteNote._id)) {
            if (evt.updateTime > remoteNote.updated) {
              const updtNote = await NotesService.instance.getNote(currentRemoteNote._id.toString())
              if (updtNote) {
                setLocalComments(updtNote.comments);
              }
            }
          }
        })()
        break;
    }
  }, [eventsState.event]);

  async function addComment() {
    if (appState.remoteNote) {
      const textarea = document.getElementById("comment") as HTMLTextAreaElement;
      NotesService.instance.addNoteComment(appState.remoteNote._id, textarea.value, plugin?.user.customData._id);
      textarea.value = "";
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.code === "Enter") {
      ensureSendVisible();
    }
  }

  function ensureSendVisible() {
    if (sendButton.current) {
      const inView = isVisible(sendButton.current);
      if (!inView) {
        let position = sendButton.current.getBoundingClientRect();
        window.scrollTo(position.left, position.top + window.scrollY + 200);
      }
    }
  }

  function clearComment() {
    const textarea = document.getElementById("comment") as HTMLTextAreaElement;
    setAreaText((textarea.value = ""));
  }


  return (
    <div className="px-2 mt-1">
      <div className={`sm:col-span-2`}>
        <label htmlFor="message" className="flex items-center h-10 space-x-2">
          <span>{getAvatar(guestName, guestImage, guestEmail, 8)}</span> <span>{t('you')}</span>
        </label>
        <div className="mt-1">
          <TextareaAutosize onChange={(e) => setAreaText(e.target.value)} onKeyDown={(e: any) => handleKeydown(e)} onHeightChange={ensureSendVisible} style={{ fontSize: "1rem" }} minRows={2} id="comment" name="message" rows={2} className="relative block w-full px-2 py-1 border rounded-md shadow-sm " aria-describedby="message-max" defaultValue={""} />
        </div>
      </div>
      <div className="flex justify-end w-full mt-2">
        <button className={areaText === '' ? 'text-obs-faint' : 'text-obs-normal'} onClick={areaText === '' ? undefined : clearComment} type="button">
          {t('clear')}
        </button>
        <button ref={sendButton} onClick={addComment} type="button">
          {t('send')}
        </button>
      </div>
      <div className="flex flex-col mt-4 space-y-4">
        {localComments?.sort((a, b) => (a.created > b.created) ? -1 : 1).map((noteComment) => {
          return (
            <Fragment key={noteComment.created}>
              <NoteCommentComponent comment={noteComment}></NoteCommentComponent>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
