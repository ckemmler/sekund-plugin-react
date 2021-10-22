import { Note } from "@/domain/Note";
import NotesService from "@/services/NotesService";
import { AppAction, AppActionKind, AppState } from "@/state/AppReducer";
import { dispatch, setCurrentNoteState } from "@/utils";
import { TFile } from "obsidian";
import * as Realm from "realm-web";

export default class NoteSyncService {
  private static _instance: NoteSyncService;
  public appState: AppState;
  static get instance() {
    return NoteSyncService._instance;
  }

  constructor(private user: Realm.User, private subdomain: string, private dispatchers: React.Dispatch<AppAction>[]) {
    NoteSyncService._instance = this;
  }

  getNotes() {
    return this.user
      .mongoClient("mongodb-atlas")
      .db(this.subdomain === "development" ? "sekund" : this.subdomain)
      .collection("notes");
  }

  async renameNote({ name, path }: TFile) {
    const { remoteNote } = this.appState;
    await this.getNotes().updateOne({ _id: remoteNote._id }, { $set: { title: name, path } });
  }

  async unpublish() {
    const { remoteNote } = this.appState;
    await this.getNotes().deleteOne({ _id: remoteNote._id });
    setCurrentNoteState(this.dispatchers, { published: false, fileSynced: false });
  }

  async compareNotes(file: TFile) {
    const { path, stat } = file;
    dispatch(this.dispatchers, AppActionKind.SetCurrentFile, file);
    setCurrentNoteState(this.dispatchers, { fetching: true, published: false });
    const rNote = await this.getNoteByPath(file.path);
    dispatch(this.dispatchers, AppActionKind.SetRemoteNote, rNote);
    const fileSynced = rNote && rNote.updated === stat.mtime;
    setCurrentNoteState(this.dispatchers, { fileSynced, fetching: false, published: rNote !== null });
    return rNote;
  }

  async getNoteByPath(path: string): Promise<Note> {
    // TODO: add a NotesService method to fetch a note by path directly
    const noteByPath = await this.getNotes().findOne({ path });
    const rNote = await NotesService.instance.getNote(noteByPath._id.toString());
    return rNote;
  }

  async syncFile() {
    const file = this.appState.currentFile;
    setCurrentNoteState(this.dispatchers, this.appState.currentNoteState.published ? { publishing: true } : { synchronizing: true });
    const { remoteNote } = this.appState;
    await this.user.functions.upsertNote({
      path: file.path,
      title: file.name,
      content: await file.vault.read(file),
      created: file.stat.ctime,
      updated: file.stat.mtime,
      firstPublished: remoteNote && remoteNote.firstPublished ? remoteNote.firstPublished : Date.now(),
      lastPublished: Date.now(),
    });
    const rNote = await this.getNoteByPath(file.path);
    dispatch(this.dispatchers, AppActionKind.SetRemoteNote, rNote);
    setTimeout(() => {
      setCurrentNoteState(this.dispatchers, { publishing: false, published: true, fileSynced: true, synchronizing: false });
    }, 800);
  }
}
