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

import {
	action, computed, observable, reaction,
} from 'mobx';
import { SchemaType } from '../components/Control';
import {
	ParsedMessageItem,
	ActMessageItem,
	isParsedMessageItem,
	isActMessageItem,
	ReplayMessage,
} from '../models/Message';
import Store from './Store';
import { getFromLocalStorage, setInLocalStorage } from '../helpers/localStorageManager';
import { Indicator } from '../components/MessageList';

export default class MessageListDataStore {
	@observable parsedMessagesHistory: ParsedMessageItem[] = [];

	@observable actMessagesHistory: ActMessageItem[] = [];

	@observable replayList: ReplayMessage[] = [];

	@observable editorCode = '{}';

	@observable editMessageMode = false;

	@observable editedMessageId = '';

	@observable editedMessageSendDelay = 0;

	buildEditedMessage = (id: string): ParsedMessageItem | ActMessageItem | undefined => {
		if (this.store.selectedSchemaType === 'parsed-message') {
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
		}
		if (this.store.selectedSchemaType === 'act') {
			if (
				this.store.selectedActBox
				&& this.store.selectedService
				&& this.store.selectedMethod
			) {
				const editedMessage: ActMessageItem = {
					id,
					actBox: this.store.selectedActBox,
					fullServiceName: this.store.selectedService,
					methodName: this.store.selectedMethod?.methodName,
					message: this.editorCode,
					delay: this.editedMessageSendDelay,
					indicator: 'indicator_edited',
				};
				return editedMessage;
			}
			return undefined;
		}
		return undefined;
	};

	@action
	addToReplayList = (message: ReplayMessage) => {
		this.replayList.push(message);
	};

	@action saveEditedMessage = () => {
		if (this.editedMessageId !== '') {
			const editedMessage = this.buildEditedMessage(this.editedMessageId);
			if (editedMessage !== undefined) {
				if (
					this.store.selectedSchemaType === 'parsed-message'
					&& isParsedMessageItem(editedMessage)
				) {
					this.parsedMessagesHistory = this.parsedMessagesHistory.map(message =>
						(message.id === this.editedMessageId ? editedMessage : message));
				} else if (
					this.store.selectedSchemaType === 'act'
					&& isActMessageItem(editedMessage)
				) {
					this.actMessagesHistory = this.actMessagesHistory.map(message =>
						(message.id === this.editedMessageId ? editedMessage : message));
				}
			}
			this.setEditMessageMode(false);
		}
	};

	@action selectMessage = (id: string) => {
		if (this.store.selectedSchemaType === 'parsed-message') {
			const selectedMessage = this.parsedMessagesHistory.find(
				message => message.id === id,
			) as ParsedMessageItem;

			this.setEditorProperties(
				selectedMessage.sessionId,
				selectedMessage.dictionary,
				selectedMessage.messageType,
				selectedMessage.message as string,
			);
		} else if (this.store.selectedSchemaType === 'act') {
			const selectedMessage = this.actMessagesHistory.find(
				message => message.id === id,
			) as ActMessageItem;

			this.setEditorProperties(
				selectedMessage.actBox,
				selectedMessage.fullServiceName,
				selectedMessage.methodName,
				selectedMessage.message as string,
			);
		}
		this.setEditMessageMode(true);
		this.setEditedMessageId(id);
	};

	@action addParsedMessage = (message: ParsedMessageItem | ActMessageItem) => {
		const messageWithId: ParsedMessageItem | ActMessageItem = message;
		messageWithId.indicator = 'indicator_unvisible';
		if (isParsedMessageItem(messageWithId)) {
			this.parsedMessagesHistory.push(messageWithId);
		} else if (isActMessageItem(messageWithId)) {
			this.actMessagesHistory.push(messageWithId);
		}
	};

	@action clearParsedMessages = () => {
		if (this.store.selectedSchemaType === 'parsed-message') {
			this.parsedMessagesHistory = [];
		} else if (this.store.selectedSchemaType === 'act') {
			this.actMessagesHistory = [];
		}

		if (this.editMessageMode === true) {
			this.setEditMessageMode(false);
		}
	};

	@action setEditorCode = (code: string) => {
		this.editorCode = code;
	};

	setEditorProperties = (
		sessionOrActBox: string | null,
		dictionaryOrService: string | null,
		messageTypeOrMethod: string | null,
		editorCode: string,
	) => {
		if (this.store.selectedSchemaType === 'parsed-message') {
			this.store.selectedSession = sessionOrActBox;
			this.store.selectedDictionaryName = dictionaryOrService;
			this.store.selectedMessageType = messageTypeOrMethod;
		} else if (this.store.selectedSchemaType === 'act') {
			this.store.selectedActBox = sessionOrActBox;
			this.store.selectedService = dictionaryOrService;
			this.store.setSelectedMethod(messageTypeOrMethod);
		}

		if (editorCode) {
			this.setEditorCode(editorCode);
		}
	};

	@action clearIndicators = () => {
		if (this.store.selectedSchemaType === 'parsed-message') {
			this.parsedMessagesHistory = this.parsedMessagesHistory.map(message => ({
				...message,
				indicator: 'indicator_unvisible',
			}));
		} else if (this.store.selectedSchemaType === 'act') {
			this.actMessagesHistory.map(message => ({
				...message,
				indicator: 'indicator_unvisible',
			}));
			for (let i = 0; i < this.actMessagesHistory.length; i++) {
				this.actMessagesHistory[i].indicator = 'indicator_unvisible';
			}
		}
	};

	@action changeIndicator = (id: string, indicator: Indicator) => {
		if (this.store.selectedSchemaType === 'parsed-message') {
			this.parsedMessagesHistory = this.parsedMessagesHistory.map(message =>
				(message.id === id ? { ...message, indicator } : message));
		} else if (this.store.selectedSchemaType === 'act') {
			this.actMessagesHistory = this.actMessagesHistory.map(message =>
				(message.id === id ? { ...message, indicator } : message));
		}
	};

	@action setEditedMessageSendDelay = (delay: number) => {
		if (delay >= 0) {
			this.editedMessageSendDelay = delay;
		}
	};

	@observable setEditedMessageId = (id: string) => {
		this.editedMessageId = id;
		if (this.store.selectedSchemaType === 'parsed-message') {
			setInLocalStorage('editedParsedMessageId', id);
		} else if (this.store.selectedSchemaType === 'act') {
			setInLocalStorage('editedActMessageId', id);
		}
	};

	@action setEditMessageMode = (mode: boolean) => {
		this.editMessageMode = mode;
		if (mode === false) {
			this.setEditedMessageId('');
		}
		if (this.store.selectedSchemaType === 'parsed-message') {
			setInLocalStorage('editParsedMessageMode', mode.toString());
		} else if (this.store.selectedSchemaType === 'act') {
			setInLocalStorage('editActMessageMode', mode.toString());
		}
	};

	@action deleteMessageFromReplayList = (id: string) => {
		this.replayList = this.replayList.filter(message => message.id !== id);
	};

	prepareForSelectedSchemaType = (type: SchemaType) => {
		switch (type) {
			case 'parsed-message':
				this.setEditMessageMode(getFromLocalStorage('editParsedMessageMode') === 'true');

				this.editedMessageId = getFromLocalStorage('editedParsedMessageId') || '';
				break;
			case 'act':
				this.setEditMessageMode(getFromLocalStorage('editActMessageMode') === 'true');

				this.editedMessageId = getFromLocalStorage('editedActMessageId') || '';

				break;
			default:
				throw new Error('');
		}
	};

	@computed get getCurrentMessagesArray() {
		return this.store.selectedSchemaType === 'parsed-message'
			? this.parsedMessagesHistory
			: this.actMessagesHistory;
	}

	@action renameMessage = (messageId: string, newName: string) => {
		if (this.store.selectedSchemaType === 'parsed-message') {
			this.parsedMessagesHistory = this.parsedMessagesHistory.map(message =>
				(message.id === messageId ? { ...message, name: newName } : message));
		} else if (this.store.selectedSchemaType === 'act') {
			this.actMessagesHistory = this.actMessagesHistory.map(message =>
				(message.id === messageId ? { ...message, name: newName } : message));
		}
	};

	@action clearUntitledMessages = () => {
		if (this.store.selectedSchemaType === 'parsed-message') {
			this.parsedMessagesHistory = this.parsedMessagesHistory.filter(({ name }) => !!name);
		} else if (this.store.selectedSchemaType === 'act') {
			this.actMessagesHistory = this.actMessagesHistory.filter(({ name }) => !!name);
		}
	};

	constructor(private store: Store) {
		reaction(
			() => this.parsedMessagesHistory.slice(),
			parsedMessageHistory => {
				setInLocalStorage('parsedMessagesHistory', JSON.stringify(parsedMessageHistory));
			},
		);

		reaction(
			() => this.actMessagesHistory.slice(),
			actMessagesHistory => {
				setInLocalStorage('actMessagesHistory', JSON.stringify(actMessagesHistory));
			},
		);
	}
}
