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

import { action, observable, reaction } from 'mobx';
import { ParsedMessageItem } from '../models/Message';
import Store from './Store';
import { setInLocalStorage, getFromLocalStorage } from '../helpers/localStorageManager';
import { Indicator } from '../components/MessageList';
import MessageListStore from './MessageListStore';

export default class ParsedMessagesStore extends MessageListStore<ParsedMessageItem> {
	@observable parsedMessagesHistory: ParsedMessageItem[] = [];

	@observable editorCode = '{}';

	@observable editMessageMode = false;

	@observable editedMessageId = '';

	@observable editedMessageSendDelay = 0;

	buildEditedMessage = (id: string): ParsedMessageItem | undefined => {
		if (
			this.store.selectedSession
			&& this.store.selectedDictionaryName
			&& this.store.selectedMessageType
		) {
			const editedMessage: ParsedMessageItem = {
				id,
				sessionId: this.store.selectedSession,
				dictionary: this.store.selectedDictionaryName,
				messageType: this.store.selectedMessageType,
				message: this.editorCode,
				delay: this.editedMessageSendDelay,
				indicator: 'indicator_edited',
			};
			return editedMessage;
		}
		return undefined;
	};

	@action saveEditedMessage = () => {
		if (this.editedMessageId !== '') {
			const editedMessage = this.buildEditedMessage(this.editedMessageId);
			if (editedMessage !== undefined) {
				this.parsedMessagesHistory = this.parsedMessagesHistory.map(message =>
					(message.id === this.editedMessageId ? editedMessage : message));
			}
			this.setEditMessageMode(false);
		}
	};

	@action selectMessage = (id: string) => {
		const selectedMessage = this.parsedMessagesHistory.find(
			message => message.id === id,
		) as ParsedMessageItem;

		this.setEditorProperties(
			selectedMessage.sessionId,
			selectedMessage.dictionary,
			selectedMessage.messageType,
			selectedMessage.message as string,
		);
		this.setEditMessageMode(true);
		this.setEditedMessageId(id);
	};

	@action addMessage = (message: ParsedMessageItem) => {
		this.parsedMessagesHistory.push({ ...message, indicator: 'indicator_unvisible' });
	};

	@action clearMessageHistory = () => {
		this.parsedMessagesHistory = [];

		if (this.editMessageMode === true) {
			this.setEditMessageMode(false);
		}
	};

	setEditorProperties = (
		sessionOrActBox: string | null,
		dictionaryOrService: string | null,
		messageTypeOrMethod: string | null,
		editorCode: string,
	) => {
		this.store.selectedSession = sessionOrActBox;
		this.store.selectedDictionaryName = dictionaryOrService;
		this.store.selectedMessageType = messageTypeOrMethod;

		if (editorCode) {
			this.setEditorCode(editorCode);
		}
	};

	@action clearIndicators = () => {
		this.parsedMessagesHistory = this.parsedMessagesHistory.map(message => ({
			...message,
			indicator: 'indicator_unvisible',
		}));
	};

	@action changeIndicator = (id: string, indicator: Indicator) => {
		this.parsedMessagesHistory = this.parsedMessagesHistory.map(message =>
			(message.id === id ? { ...message, indicator } : message));
	};

	@action setEditMessageMode = (mode: boolean) => {
		this.editMessageMode = mode;
		if (mode === false) {
			this.setEditedMessageId('');
		}
		setInLocalStorage('editParsedMessageMode', mode.toString());
	};

	@action deleteMessage = (id: string) => {
		this.parsedMessagesHistory = this.parsedMessagesHistory.filter(
			message => message.id !== id,
		);
	};

	prepareForSelectedSchemaType = () => {
		this.setEditMessageMode(getFromLocalStorage('editParsedMessageMode') === 'true');
		this.editedMessageId = getFromLocalStorage('editedParsedMessageId') || '';
	};

	constructor(private store: Store) {
		super();
		reaction(
			() => this.parsedMessagesHistory.slice(),
			parsedMessageHistory => {
				setInLocalStorage('parsedMessagesHistory', JSON.stringify(parsedMessageHistory));
			},
		);
	}
}
