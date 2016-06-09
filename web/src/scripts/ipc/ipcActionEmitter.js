/**
 *    Copyright (C) 2015 Deco Software Inc.
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU Affero General Public License, version 3,
 *    as published by the Free Software Foundation.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU Affero General Public License for more details.
 *
 *    You should have received a copy of the GNU Affero General Public License
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

import { routeActions, } from 'react-router-redux'

const ipc = Electron.ipcRenderer

import {
  save,
  saveAs,
  appendPackagerOutput,
  createProject,
  openProject,
  setSimulatorStatus,
} from '../actions/applicationActions'
import {
  openInstallModuleDialog,
  openImportTemplateDialog,
} from '../actions/dialogActions'
import {
  addSubPath,
  removeSubPath,
  removeSubPathBatch,
  fetchSubPath,
  batchAddSubPaths,
  markSaved,
  clearFileState,
} from '../actions/fileActions'
import {
  cacheDoc,
  markClean,
  clearEditorState,
  insertComponent,
  clearCurrentDoc,
  insertTemplate,
} from '../actions/editorActions'
import {
  setConsoleVisibility,
  startProgressBar,
  updateProgressBar,
  endProgressBar,
  upgradeStatus,
} from '../actions/uiActions'
import {
  closeTab,
  closeAllTabs,
  clearFocusedTab,
} from '../actions/tabActions'

import AcceleratorConstants from 'shared/constants/ipc/AcceleratorConstants'
const {
  SHOULD_CREATE_NEW_PROJECT,
  SHOULD_OPEN_PROJECT_DIALOG,
  SHOULD_TOGGLE_TERM,
  SHOULD_CLOSE_TAB,
  SHOULD_SAVE_PROJECT,
  SHOULD_SAVE_PROJECT_AS,
  OPEN_INSTALL_MODULE_DIALOG,
  OPEN_IMPORT_TEMPLATE_DIALOG,
} = AcceleratorConstants

import ProjectConstants from 'shared/constants/ipc/ProjectConstants'
const {
  SAVE_PROJECT,
  SAVE_AS_PROJECT,
  SET_PROJECT_DIR,
} = ProjectConstants

import FileConstants from 'shared/constants/ipc/FileConstants'
const {
  ADD_SUB_PATH,
  ADD_SUB_PATH_BATCH,
  ON_FILE_DATA,
  REMOVE_SUB_PATH,
  REMOVE_SUB_PATH_BATCH,
  SAVE_SUCCESSFUL,
} = FileConstants

import ProcessConstants from 'shared/constants/ipc/ProcessConstants'
const {
  PACKAGER_OUTPUT,
  UPDATE_SIMULATOR_STATUS,
} = ProcessConstants

import UIConstants from 'shared/constants/ipc/UIConstants'
const {
  PROGRESS_START,
  PROGRESS_UPDATE,
  PROGRESS_END,
  UPGRADE_STATUS,
} = UIConstants

import { CONTENT_PANES } from '../constants/LayoutConstants'
import { openFile } from '../actions/compositeFileActions'
import TabUtils from '../utils/TabUtils'

/**
 * Ties ipc listeners to actions
 */
const ipcActionEmitter = (store) => {
  ipc.on(ADD_SUB_PATH_BATCH, (evt, payload) => {
    store.dispatch(batchAddSubPaths(payload))
  })

  ipc.on(SET_PROJECT_DIR, (evt, payload) => {
    const rootPath = payload.absolutePath
    let query = {}
    if (payload.isTemp) {
      query.temp = true
    }
    store.dispatch(clearFileState())
    store.dispatch(clearEditorState())
    store.dispatch(closeAllTabs())
    const state = store.getState()
    store.dispatch(routeActions.push({
      pathname: `/workspace/${rootPath}`,
      query: query,
    }))
  })

  ipc.on(OPEN_INSTALL_MODULE_DIALOG, () => {
    store.dispatch(openInstallModuleDialog())
  })

  ipc.on(OPEN_IMPORT_TEMPLATE_DIALOG, () => {
    store.dispatch(openImportTemplateDialog())
  })

  ipc.on(SHOULD_OPEN_PROJECT_DIALOG, () => {
    store.dispatch(openProject())
  })

  ipc.on(SHOULD_CREATE_NEW_PROJECT, (evt, payload) => {
    store.dispatch(createProject())
  })

  ipc.on(PACKAGER_OUTPUT, (evt, payload) => {
    store.dispatch(appendPackagerOutput(payload))
  })

  ipc.on(UPDATE_SIMULATOR_STATUS, (evt, payload) => {
    store.dispatch(setSimulatorStatus(payload.simulatorIsOpen))
  })

  ipc.on(REMOVE_SUB_PATH, (evt, payload) => {
    store.dispatch(removeSubPath(payload))
  })

  ipc.on(REMOVE_SUB_PATH_BATCH, (evt, payload) => {
    store.dispatch(removeSubPathBatch(payload))
  })

  ipc.on(ON_FILE_DATA, (evt, payload) => {
    store.dispatch(cacheDoc(payload))
  })

  ipc.on(SAVE_SUCCESSFUL, (evt, payload) => {
    store.dispatch(markClean(payload.id))
    store.dispatch(markSaved(payload.id))
  })

  ipc.on(SHOULD_TOGGLE_TERM, () => {
    const state = store.getState()
    store.dispatch(setConsoleVisibility(!state.ui.consoleVisible))
  })

  ipc.on(SHOULD_CLOSE_TAB, () => {
    const tabs = store.getState().ui.tabs

    const tabToFocus = TabUtils.determineTabToFocus(tabs.CENTER.tabIds, tabs.CENTER.focusedTabId, tabs.CENTER.focusedTabId)

    store.dispatch(closeTab(CONTENT_PANES.CENTER, tabs.CENTER.focusedTabId))

    // If there's another tab to open, open the file for it
    if (tabToFocus) {
      store.dispatch(openFile(store.getState().directory.filesById[tabToFocus]))
    } else {
      store.dispatch(clearFocusedTab(CONTENT_PANES.CENTER))
      store.dispatch(clearCurrentDoc())
      store.dispatch(clearSelections())
    }

  })

  ipc.on(SHOULD_SAVE_PROJECT, () => {
    const state = store.getState()
    const location = state.routing.location
    if (location.query && location.query.temp == "true") {
      store.dispatch(saveAs())
    } else {
      store.dispatch(save())
    }
  })

  ipc.on(SHOULD_SAVE_PROJECT_AS, () => {
    store.dispatch(saveAs())
  })

  ipc.on(PROGRESS_START, (evt, obj) => {
    const {name, progress} = obj.payload
    store.dispatch(startProgressBar(name, progress))
  })

  ipc.on(PROGRESS_UPDATE, (evt, obj) => {
    const {name, progress} = obj.payload
    store.dispatch(updateProgressBar(name, progress))
  })

  ipc.on(PROGRESS_END, (evt, obj) => {
    const {name, progress} = obj.payload
    store.dispatch(endProgressBar(name, progress))
  })

  ipc.on(UPGRADE_STATUS, (evt, obj) => {
    const {status} = obj.payload
    store.dispatch(upgradeStatus(status))
  })
}

export default ipcActionEmitter
