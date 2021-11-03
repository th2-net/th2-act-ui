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

import { action, makeObservable, observable } from 'mobx';
import { ReplayItem, ReplayStatus } from '../../models/Message';
import RootStore from '../RootStore';

export default abstract class ReplayStore<T extends ReplayItem, U> {
	replayList: T[] = [];

	editedMessageCode = '{}';

	editMessageMode = false;

	editedMessageId: string | null = null;

	editedMessageSendDelay = 0;

	protected constructor(protected rootStore: RootStore) {
		makeObservable(this, {
			replayList: observable,
			editedMessageCode: observable,
			editMessageMode: observable,
			editedMessageId: observable,
			editedMessageSendDelay: observable,
			saveEditedMessage: action,
			addMessage: action,
			clearReplayList: action,
			setEditedMessageCode: action,
			resetStatuses: action,
			changeStatus: action,
			setEditedMessageId: action,
			setEditMessageMode: action,
			removeMessage: action,
			reorder: action,
			renameMessage: action,
		});
	}

	abstract buildEditedMessage: (id: string, options: U) => T | null;

	abstract get options(): U | null;

	saveEditedMessage = () => {
		if (this.editedMessageId) {
			const options = this.options;

			if (!options) return;

			const editedMessage = this.buildEditedMessage(this.editedMessageId, options);
			if (editedMessage) {
				this.replayList = this.replayList.map(message =>
					message.id === this.editedMessageId ? editedMessage : message,
				);
			}
			this.setEditMessageMode(false);
		}
	};

	addMessage = (message: T) => {
		this.replayList = [...this.replayList, message];
	};

	clearReplayList = () => {
		this.replayList = [];

		if (this.editMessageMode) {
			this.setEditMessageMode(false);
		}
	};

	clearUntitled = () => {
		this.replayList = this.replayList.filter(message => !!message.name);
	};

	setEditedMessageCode = (code: string) => {
		this.editedMessageCode = code;
	};

	resetStatuses = () => {
		this.replayList = this.replayList.map(message => ({
			...message,
			status: { type: 'ready', response: null },
		}));
	};

	renameMessage = (id: string, name: string) => {
		this.replayList = this.replayList.map(message => (message.id === id ? { ...message, name } : message));
	};

	changeStatus = (id: string, status: ReplayStatus) => {
		this.replayList = this.replayList.map(message => (message.id === id ? { ...message, status } : message));
	};

	changeDelay = (id: string, delay: number) => {
		if (delay >= 0 && Number.isInteger(delay)) {
			this.replayList = this.replayList.map(message => (message.id === id ? { ...message, delay } : message));
		}
	};

	setEditedMessageId = (id: string) => {
		this.editedMessageId = id;
	};

	setEditMessageMode = (mode: boolean) => {
		this.editMessageMode = mode;

		if (!mode) {
			this.setEditedMessageId('');
		}
	};

	removeMessage = (id: string) => {
		this.replayList = this.replayList.filter(message => message.id !== id);
	};

	reorder = (destIndex: number, srcIndex: number) => {
		const temp = [...this.replayList];
		const [removed] = temp.splice(srcIndex, 1);
		temp.splice(destIndex, 0, removed);
		this.replayList = temp;
	};

	abstract replayMessage: (id: string) => Promise<void>;

	abstract exportReplayList: () => void;

	abstract importFromJSON: (jsonString: string) => void;
}
