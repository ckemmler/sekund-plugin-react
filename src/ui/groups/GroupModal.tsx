/* This example requires Tailwind CSS v2.0+ */
import { Group } from "@/domain/Group";
import { People } from "@/domain/People";
import { SelectOption } from "@/domain/Types";
import { peopleAvatar } from "@/helpers/avatars";
import { setHandleDisplay } from "@/helpers/obsidian";
import GroupsService from "@/services/GroupsService";
import PeoplesService from "@/services/PeoplesService";
import UsersService from "@/services/UsersService";
import { useAppContext } from "@/state/AppContext";
import { usePeoplesContext } from "@/state/PeoplesContext";
import { PeoplesActionKind } from "@/state/PeoplesReducer";
import { TrashIcon, XIcon } from "@heroicons/react/solid";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  group: Group | null;
};

export default function GroupModal({ open, setOpen, group }: Props) {
  const { t } = useTranslation(["common", "plugin"]);
  const [commitEnabled, setCommitEnabled] = useState(false);
  const commitButton = useRef<HTMLButtonElement>(null);
  const { peoplesDispatch } = usePeoplesContext();
  const shade = useRef<any>();

  const { appState } = useAppContext();
  const { userProfile } = appState;

  if (group === null) {
    group = { peoples: [] as Array<People> } as Group;
  }
  const [localGroup, setLocalGroup] = useState<Group>(group);
  const [teamMembers, setTeamMembers] = useState<SelectOption[]>([]);
  const selectInput = useRef<any>();

  // remove those pesky resize handles when showing this modal, and restore
  // them when it closes
  useEffect(() => {
    loadOptions("");
  }, [open])

  useEffect(() => {
    const commitEnabled = localGroup?.name !== undefined && localGroup?.name.length > 0 && localGroup?.peoples.length > 0;
    setCommitEnabled(commitEnabled);
  }, [localGroup]);

  async function loadOptions(inputValue: string) {
    const found = (await UsersService.instance.findUsers(inputValue.toLowerCase(), [userProfile._id])).filter((userOrGroup) => userOrGroup.value.type === "user");
    setTeamMembers(found)
  }

  async function addSelectedUser() {
    const selectElement = selectInput.current as HTMLSelectElement;
    const selectedUser = await PeoplesService.instance.getPeople(selectElement.value);
    setLocalGroup({ ...localGroup, peoples: [...localGroup.peoples, selectedUser] });
    selectElement.value = 'none';
  }

  async function removePeople(p: People) {
    if (localGroup) {
      if (p._id.equals(userProfile._id)) {
        alert("You cannot remove yourself.");
        return;
      }
      const updtPeoples = localGroup.peoples?.filter((people) => people._id !== p._id);
      setLocalGroup({ ...localGroup, peoples: updtPeoples });
    }
  }

  function setGroupName(gn: string) {
    setLocalGroup({ ...localGroup, name: gn });
  }

  async function commit() {
    const expandedGroup = await GroupsService.instance.upsertGroup(localGroup);
    setLocalGroup(expandedGroup);
    if (localGroup._id) {
      peoplesDispatch({ type: PeoplesActionKind.UpdateGroup, payload: expandedGroup });
    } else {
      peoplesDispatch({ type: PeoplesActionKind.AddGroup, payload: expandedGroup });
    }
    setOpen(false);
  }

  function members() {
    const children: JSX.Element[] = [];
    const closeButtonClasses = "rounded-md cursor-pointer hover:text-secondary focus:outline-none w-4 h-4 m-2";
    const { peoples } = localGroup;
    peoples.forEach((p) =>
      children.push(
        <div key={p._id.toString()} className="flex items-center py-1 pl-2 pr-1 mb-1 mr-1 truncate rounded-md bg-obs-tertiary">
          {peopleAvatar(p)}
          <span className="ml-2 truncate">{`${p.name || p.email}`}</span>
          <XIcon onClick={() => removePeople(p)} className={closeButtonClasses}></XIcon>
        </div>
      )
    );
    return children;
  }

  function destroy() {
    const confirmed = confirm("Are you sure?");
    if (confirmed && group !== null && group._id) {
      GroupsService.instance.deleteGroup(group._id);
      peoplesDispatch({ type: PeoplesActionKind.RemoveGroup, payload: localGroup });
      setOpen(false);
    }
  }

  function deleteButton() {
    if (group?._id) {
      return (
        <button onClick={destroy} type="button" className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm cursor-pointer bg-accent text-white border-transparent`}>
          <div className="flex items-center">
            Delete
            <TrashIcon className="w-4 h-4 ml-2"></TrashIcon>
          </div>
        </button>
      );
    }
    return <div></div>;
  }

  return (
    <div ref={shade} onClick={(evt) => { if (evt.target === shade.current) { setOpen(false) } }} className="fixed inset-0 flex flex-col items-center justify-center bg-obs-cover">
      <div className="relative inline-block w-full max-w-xs p-6 px-4 pt-5 pb-4 text-left rounded-lg sm:my-8 bg-obs-primary">
        <div className="absolute top-0 right-0 pt-4 pr-4 sm:block">
          <div className="flex flex-col justify-center rounded-md cursor-pointer bg-primary hover:text-obs-muted focus:outline-none" onClick={() => setOpen(false)}>
            <span className="sr-only">{t('close')}</span>
            <XIcon className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>
        <div>
          <div className="text-lg font-medium leading-6 text-primary">{localGroup?._id ? t('plugin:editGroup') : t('plugin:addGroup')}</div>
          <div className="max-w-xl mt-2 text-sm text-secondary">
            <p>{t('plugin:groupName')}:</p>
          </div>
          <div className="mt-3 sm:flex sm:items-center">
            <input onChange={(evt) => setGroupName(evt.target.value)} defaultValue={group ? group.name : ""} className="w-full input" type="text" placeholder={t('plugin:groupNameDesc')} />
          </div>
          <div className="max-w-xl mt-4 text-sm text-secondary">
            <p>{t('plugin:groupMembers')}:</p>
          </div>
          <div className="flex items-center mt-3 space-x-2">
            <div className="self-start flex-grow overflow-hidden truncate">
              <select
                className="min-w-full pl-2 pr-4 truncate dropdown"
                ref={selectInput}
              >
                <>
                  <option key="none" value="none">{t('plugin:chooseUser')}</option>
                  {teamMembers.map((option: SelectOption) => (
                    <option key={option.value.id} value={option.value.id}>{option.label}</option>
                  ))}
                </>
              </select>
            </div>
            <button className="flex-shrink-0" onClick={() => addSelectedUser()}>
              {t('add')}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap mt-5 sm:mt-6 text-secondary">{members()}</div>
        <div className="flex items-center justify-between mt-4">
          {deleteButton()}
          <div className="flex justify-end w-full pt-2">
            <button onClick={() => setOpen(false)} type="button">
              {t('cancel')}
            </button>
            <button ref={commitButton} onClick={commitEnabled ? commit : undefined} type="button">
              {localGroup?._id ? t('update') : t('create')}
            </button>
          </div>
        </div>
      </div>
    </div >
  );
}
