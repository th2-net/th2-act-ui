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

import { action, flow, makeObservable, observable, reaction } from 'mobx';
import { nanoid } from 'nanoid';
import {
	ActReplayItem,
	isActReplayItem,
	isParsedMessageReplayItem,
	MessageSendingResponse,
	ParsedMessageReplayItem,
	ReplayItem,
} from '../models/Message';
import RootStore from './RootStore';
import api from '../api';
import { downloadFile } from '../helpers/downloadFile';
import localStorageWorker from '../helpers/localStorageWorker';

type ReplayExportData<T extends ReplayItem> = Omit<T, 'id' | 'status' | 'createdAt'>;

export default class ReplayStore {
	replayList: Array<ParsedMessageReplayItem | ActReplayItem> = [];

	editedReplayItemCode = '{}';

	editReplayItemMode = false;

	editedReplayItemId: string | null = null;

	constructor(protected rootStore: RootStore) {
		this.replayList = localStorageWorker.getReplayList();

		makeObservable(this, {
			replayList: observable,
			editedReplayItemCode: observable,
			editReplayItemMode: observable,
			editedReplayItemId: observable,
			saveEditedReplayItem: action,
			addToReplayList: action,
			clearReplayList: action,
			clearUntitled: action,
			setEditedReplayItemCode: action,
			resetStatuses: action,
			changeStatus: action,
			changeDelay: action,
			setEditedReplayItemId: action,
			setEditReplayItemMode: action,
			removeReplayItem: action,
			reorder: action,
			renameReplayItem: action,
			importFromJSON: action,
		});

		reaction(
			() => this.replayList,
			replayList => localStorageWorker.setReplayList(replayList),
		);
	}

	buildEditedReplayItem = (id: string): ParsedMessageReplayItem | ActReplayItem | null => {
		const replayItem = this.replayList.find(item => item.id === id);

		if (isParsedMessageReplayItem(replayItem)) {
			return {
				...replayItem,
				message: this.editedReplayItemCode,
				...this.rootStore.editorStore.options.parsedMessage.selectedOptions,
				status: {
					type: 'edited',
				},
			};
		}

		if (isActReplayItem(replayItem)) {
			return {
				...replayItem,
				message: this.editedReplayItemCode,
				...this.rootStore.editorStore.options.act.selectedOptions,
				status: {
					type: 'edited',
				},
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

	clearReplayList = () => {
		this.replayList = [];

		if (this.editReplayItemMode) {
			this.setEditReplayItemMode(false);
		}
	};

	clearUntitled = () => {
		this.replayList = this.replayList.filter(replayItem => !!replayItem.name);
	};

	setEditedReplayItemCode = (code: string) => {
		this.editedReplayItemCode = code;
	};

	resetStatuses = () => {
		this.replayList = this.replayList.map(replayItem => ({
			...replayItem,
			status: { type: 'ready' },
		}));
	};

	renameReplayItem = (id: string, name: string) => {
		this.replayList = this.replayList.map(replayItem =>
			replayItem.id === id ? { ...replayItem, name } : replayItem,
		);
	};

	changeStatus = (id: string, status: ReplayItem['status']) => {
		this.replayList = this.replayList.map(replayItem =>
			replayItem.id === id ? { ...replayItem, status } : replayItem,
		);
	};

	changeDelay = (id: string, delay: number) => {
		if (delay >= 0 && Number.isInteger(delay)) {
			this.replayList = this.replayList.map(replayItem =>
				replayItem.id === id ? { ...replayItem, delay } : replayItem,
			);
		}
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

	replay = flow(function* (this: ReplayStore, id: string) {
		const replayItem = this.replayList.find(item => item.id === id);
		let result: MessageSendingResponse | null = null;

		if (replayItem) {
			try {
				if (isParsedMessageReplayItem(replayItem)) {
					const { session, dictionary, messageType, message } = replayItem;

					result = yield api.sendMessage({
						session,
						dictionary,
						messageType,
						message: JSON.parse(message),
					});
				} else if (isActReplayItem(replayItem)) {
					const { fullServiceName, methodName, message } = replayItem;

					result = yield api.callMethod({
						fullServiceName,
						methodName,
						message: JSON.parse(message),
					});
				}

				if (result) {
					replayItem.status.type = result.code === 200 ? 'success' : 'fail';
					replayItem.status.response = result;
				}
			} catch (error) {
				console.error('Error occurred while replaying', error);

				replayItem.status = {
					type: 'fail',
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
					const { session, dictionary, messageType, message, type, delay, name } = replayItem;

					return { session, dictionary, messageType, message, type, delay, name };
				}

				const { actBox, fullServiceName, methodName, message, type, delay, name } = replayItem;

				return { actBox, fullServiceName, methodName, message, type, delay, name };
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
							status: { type: 'ready' },
							id: nanoid(),
							createdAt: +new Date(),
						});
					});
			}
		} catch (error) {
			console.error('Error occurred while importing replay items', error);
		}
	};
}
