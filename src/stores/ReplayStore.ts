/** ****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

import { action, computed, flow, makeObservable, observable, reaction, runInAction } from 'mobx';
import { nanoid } from 'nanoid';
import {
	ActReplayItem,
	isActReplayItem,
	isParsedMessageReplayItem,
	MessageSendingResponse,
	ParsedMessageReplayItem,
	ReplacementConfig,
	ReplayItem,
} from '../models/Message';
import RootStore from './RootStore';
import api from '../api';
import { downloadFile } from '../helpers/downloadFile';
import localStorageWorker from '../helpers/localStorageWorker';
import applyReplacements from '../helpers/applyReplacements';

type ReplayExportData<T extends ReplayItem> = Omit<T, 'id' | 'result' | 'selected'>;

export default class ReplayStore {
	isReplaying = false;

	replayList: Array<ParsedMessageReplayItem | ActReplayItem> = [];

	editReplayItemMode = false;

	editedReplayItemId: string | null = null;

	constructor(protected rootStore: RootStore) {
		this.replayList = localStorageWorker.getReplayList();

		makeObservable(this, {
			isReplaying: observable,
			replayList: observable,
			editReplayItemMode: observable,
			editedReplayItemId: observable,
			replayItemToEdit: computed,
			selectedItems: computed,
			allItemsSelected: computed,
			saveEditedReplayItem: action,
			addToReplayList: action,
			clearSelected: action,
			resetSelectedResults: action,
			changeResult: action,
			changeDelay: action,
			setEditedReplayItemId: action,
			setEditReplayItemMode: action,
			removeReplayItem: action,
			toggleItem: action,
			toggleAll: action,
			reorder: action,
			renameReplayItem: action,
			importFromJSON: action,
			startReplay: action,
		});

		reaction(
			() => this.replayList,
			replayList => localStorageWorker.setReplayList(replayList),
		);
	}

	get replayItemToEdit() {
		return this.editReplayItemMode && this.editedReplayItemId
			? this.replayList.find(({ id }) => id === this.editedReplayItemId)
			: null;
	}

	get selectedItems() {
		return this.replayList.filter(({ selected }) => selected);
	}

	get allItemsSelected() {
		return this.replayList.every(({ selected }) => selected);
	}

	buildEditedReplayItem = (id: string): ParsedMessageReplayItem | ActReplayItem | null => {
		const replayItem = this.replayList.find(item => item.id === id);

		if (!replayItem) return null;

		const message = this.rootStore.editorStore.code;
		const { replacements } = replayItem;
		const result: ReplayItem['result'] = {
			status: 'edited',
		};

		if (isParsedMessageReplayItem(replayItem)) {
			return {
				...replayItem,
				message,
				...this.rootStore.editorStore.options.parsedMessage.selectedOptions,
				result,
				replacements,
			};
		}

		if (isActReplayItem(replayItem)) {
			return {
				...replayItem,
				message,
				...this.rootStore.editorStore.options.act.selectedOptions,
				result,
				replacements,
			};
		}

		return null;
	};

	saveEditedReplayItem = () => {
		if (this.editedReplayItemId) {
			const editedReplayItem = this.buildEditedReplayItem(this.editedReplayItemId);
			if (editedReplayItem) {
				this.replayList = this.replayList.map(replayItem =>
					replayItem.id === this.editedReplayItemId ? editedReplayItem : replayItem,
				);
			}
			this.setEditReplayItemMode(false);
		}
	};

	addToReplayList = (replayItem: ParsedMessageReplayItem | ActReplayItem) => {
		this.replayList = [...this.replayList, replayItem];
	};

	clearSelected = () => {
		if (
			this.editReplayItemMode &&
			this.replayList.find(replayItem => replayItem.id === this.editedReplayItemId)?.selected
		) {
			this.setEditReplayItemMode(false);
		}

		this.replayList = this.replayList.filter(({ selected }) => !selected);
	};

	resetSelectedResults = () => {
		this.replayList = this.replayList.map(replayItem =>
			replayItem.selected
				? {
						...replayItem,
						result: { status: 'ready' },
				  }
				: replayItem,
		);
	};

	renameReplayItem = (id: string, name: string) => {
		this.replayList = this.replayList.map(replayItem =>
			replayItem.id === id ? { ...replayItem, name } : replayItem,
		);
	};

	changeResult = (id: string, result: ReplayItem['result']) => {
		this.replayList = this.replayList.map(replayItem =>
			replayItem.id === id ? { ...replayItem, result } : replayItem,
		);
	};

	changeDelay = (id: string, delay: number) => {
		if (delay >= 0 && Number.isInteger(delay)) {
			this.replayList = this.replayList.map(replayItem =>
				replayItem.id === id ? { ...replayItem, delay } : replayItem,
			);
		}
	};

	changeReplacements = (id: string, config: ReplacementConfig[]) => {
		this.replayList = this.replayList.map(replayItem =>
			replayItem.id === id ? { ...replayItem, replacements: config } : replayItem,
		);
	};

	setEditedReplayItemId = (id: string) => {
		this.editedReplayItemId = id;
	};

	setEditReplayItemMode = (mode: boolean) => {
		this.editReplayItemMode = mode;

		if (!mode) {
			this.setEditedReplayItemId('');
		}
	};

	removeReplayItem = (id: string) => {
		this.replayList = this.replayList.filter(replayItem => replayItem.id !== id);

		if (this.editedReplayItemId === id) {
			this.setEditReplayItemMode(false);
		}
	};

	reorder = (destIndex: number, srcIndex: number) => {
		const temp = [...this.replayList];
		const [removed] = temp.splice(srcIndex, 1);
		temp.splice(destIndex, 0, removed);
		this.replayList = temp;
	};

	toggleItem = (id: string, selected: boolean) => {
		this.replayList = this.replayList.map(replayItem =>
			replayItem.id === id ? { ...replayItem, selected } : replayItem,
		);
	};

	toggleAll = (selected: boolean) => {
		this.replayList = this.replayList.map(replayItem =>
			replayItem.selected === selected ? replayItem : { ...replayItem, selected },
		);
	};

	startReplay = () => {
		this.resetSelectedResults();
		this.isReplaying = true;
		this.replayMessageRecursive(0);
	};

	replayMessageRecursive = (index: number) => {
		const { selectedItems } = this;
		setTimeout(() => {
			this.replay(selectedItems[index].id).then(() => {
				if (index < selectedItems.length - 1) {
					this.replayMessageRecursive(index + 1);
				} else {
					runInAction(() => (this.isReplaying = false));
				}
			});
		}, selectedItems[index].delay);
	};

	replay = flow(function* (this: ReplayStore, id: string) {
		const replayItem = this.replayList.find(item => item.id === id);
		let result: MessageSendingResponse | null = null;

		if (replayItem) {
			try {
				const message: object = JSON.parse(replayItem.message);

				const appliedReplacements = applyReplacements(message, replayItem.replacements, this.replayList);

				if (isParsedMessageReplayItem(replayItem)) {
					const { session, dictionary, messageType } = replayItem;

					result = yield api.sendMessage({
						session,
						dictionary,
						messageType,
						message,
					});
				} else if (isActReplayItem(replayItem)) {
					const { fullServiceName, methodName } = replayItem;

					result = yield api.callMethod({
						fullServiceName,
						methodName,
						message,
					});
				}

				if (result) {
					replayItem.result.status = result.code === 200 ? 'sent' : 'fail';
					replayItem.result.response = result;
					replayItem.result.appliedReplacements = appliedReplacements;
				}
			} catch (error) {
				console.error('Error occurred while replaying', error);

				replayItem.result = {
					status: 'fail',
				};
			} finally {
				this.replayList = [...this.replayList];
			}
		}
	});

	exportReplayList = () => {
		const exportData: Array<ReplayExportData<ParsedMessageReplayItem> | ReplayExportData<ActReplayItem>> =
			this.replayList.map(replayItem => {
				if (isParsedMessageReplayItem(replayItem)) {
					const { session, dictionary, messageType, message, type, delay, name, replacements } = replayItem;

					return { session, dictionary, messageType, message, type, delay, name, replacements };
				}

				const { actBox, fullServiceName, methodName, message, type, delay, name, replacements } = replayItem;

				return { actBox, fullServiceName, methodName, message, type, delay, name, replacements };
			});

		downloadFile(JSON.stringify(exportData, null, '    '), 'replay', 'application/json');
	};

	importFromJSON = (jsonString: string) => {
		try {
			const jsonData = JSON.parse(jsonString);

			if (Array.isArray(jsonData)) {
				jsonData
					.filter(jsonItem => isParsedMessageReplayItem(jsonItem) || isActReplayItem(jsonItem))
					.forEach((replayItem: ParsedMessageReplayItem | ActReplayItem) => {
						this.addToReplayList({
							...replayItem,
							result: { status: 'ready' },
							id: nanoid(),
							selected: false,
						});
					});
			}
		} catch (error) {
			console.error('Error occurred while importing replay items', error);
		}
	};
}
