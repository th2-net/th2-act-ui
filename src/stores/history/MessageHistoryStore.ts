/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { MessageHistoryItem } from '../../models/Message';
import Store from '../Store';
import { Indicator } from '../../components/MessageList';

export default abstract class MessageHistoryStore<T extends MessageHistoryItem> {
	history: T[] = [];

	editorCode = '{}';

	editMessageMode = false;

	editedMessageId = '';

	editedMessageSendDelay = 0;

	protected constructor(protected store: Store) {
		makeObservable(this, {
			history: observable,
			editorCode: observable,
			editMessageMode: observable,
			editedMessageId: observable,
			editedMessageSendDelay: observable,
			saveEditedMessage: action,
			addMessage: action,
			clearHistory: action,
			setEditorCode: action,
			clearIndicators: action,
			changeIndicator: action,
			setEditedMessageId: action,
			setEditMessageMode: action,
			deleteMessage: action,
		});
	}

	abstract buildEditedMessage: (id: string) => T | undefined;

	saveEditedMessage = () => {
		if (this.editedMessageId) {
			const editedMessage = this.buildEditedMessage(this.editedMessageId);
			if (editedMessage) {
				this.history = this.history.map(message =>
					message.id === this.editedMessageId ? editedMessage : message,
				);
			}
			this.setEditMessageMode(false);
		}
	};

	abstract selectMessage: (id: string) => void;

	addMessage = (message: T) => {
		this.history.push({
			...message,
			indicator: 'indicator_unvisible',
		});
	};

	clearHistory = () => {
		this.history = [];

		if (this.editMessageMode) {
			this.setEditMessageMode(false);
		}
	};

	setEditorCode = (code: string) => {
		this.editorCode = code;
	};

	abstract setEditorProperties: (
		sessionOrActBox: string | null,
		dictionaryOrService: string | null,
		messageTypeOrMethod: string | null,
		editorCode: string,
	) => void;

	clearIndicators = () => {
		this.history = this.history.map(message => ({
			...message,
			indicator: 'indicator_unvisible',
		}));
	};

	changeIndicator = (id: string, indicator: Indicator) => {
		this.history = this.history.map(message =>
			message.id === id ? { ...message, indicator } : message,
		);
	};

	setEditedMessageSendDelay = (delay: number) => {
		if (delay >= 0 && Number.isInteger(delay)) {
			this.editedMessageSendDelay = delay;
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

	deleteMessage = (id: string) => {
		this.history = this.history.filter(message => message.id !== id);
	};

	abstract replayMessage: (id: string) => Promise<void>;
}
