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
	action, observable, reaction,
} from 'mobx';
import { SchemaType } from '../components/Control';
import {
	ParsedMessageItem,
	ActMessageItem,
	isParsedMessageItem,
	isActMessageItem,
	MessageItem,
} from '../models/Message';
import Store from './Store';
import { setInLocalStorage, getFromLocalStorage } from '../helpers/localStorageManager';
import { Indicator } from '../components/MessageList';

type MessageHistory = {
	'parsed-message': ParsedMessageItem[];
	'act': ActMessageItem[];
  };

export default class MessageListDataStore<T extends MessageItem> {
	@observable private parsedMessagesHistory: ParsedMessageItem[] = [];

	@observable private actMessagesHistory: ActMessageItem[] = [];

	@observable messageHistory: MessageHistory = {
		'parsed-message': this.parsedMessagesHistory,
		act: this.actMessagesHistory,
	};

	currentType = this.store.selectedSchemaType;

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

	@action saveEditedMessage = () => {
		if (this.editedMessageId !== '') {
			const editedMessage = this.buildEditedMessage(this.editedMessageId);
			if (editedMessage !== undefined) {
				this.messageHistory[this.currentType].forEach(
					(message: ParsedMessageItem | ActMessageItem) =>
						(message.id === this.editedMessageId ? editedMessage : message),
				);
			}
			this.setEditMessageMode(false);
		}
	};

	@action selectMessage = (id: string) => {
		if (this.store.selectedSchemaType === 'parsed-message') {
			const selectedMessage = this.messageHistory['parsed-message'].find(
				message => message.id === id,
			) as ParsedMessageItem;

			this.setEditorProperties(
				selectedMessage.sessionId,
				selectedMessage.dictionary,
				selectedMessage.messageType,
				selectedMessage.message as string,
			);
		} else if (this.store.selectedSchemaType === 'act') {
			const selectedMessage = this.messageHistory.act.find(
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
		if (isParsedMessageItem(message)) {
			this.messageHistory['parsed-message'].push({ ...message, indicator: 'indicator_unvisible' });
		} else if (isActMessageItem(message)) {
			this.messageHistory.act.push({ ...message, indicator: 'indicator_unvisible' });
		}
	};

	@action clearParsedMessages = () => {
		this.messageHistory[this.store.selectedSchemaType] = [];

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
		this.messageHistory[this.currentType].forEach((message: ParsedMessageItem | ActMessageItem) => ({
			...message,
			indicator: 'indicator_unvisible',
		}));
	};

	@action changeIndicator = (id: string, indicator: Indicator) => {
		this.messageHistory[this.currentType].forEach((message: ParsedMessageItem | ActMessageItem) =>
			(message.id === id ? { ...message, indicator } : message));
	};

	@action setEditedMessageSendDelay = (delay: number) => {
		if (delay >= 0 && Number.isInteger(delay)) {
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

	@action deleteMessage = (id: string) => {
		if (this.store.selectedSchemaType === 'parsed-message') {
			this.messageHistory['parsed-message'] = this.messageHistory['parsed-message'].filter(
				message => message.id !== id,
			);
		} else if (this.store.selectedSchemaType === 'act') {
			this.messageHistory.act = this.messageHistory.act.filter(
				message => message.id !== id,
			);
		}
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

	constructor(private store: Store) {
		reaction(
			() => this.messageHistory['parsed-message'].slice(),
			parsedMessageHistory => {
				setInLocalStorage('parsedMessagesHistory', JSON.stringify(parsedMessageHistory));
			},
		);

		reaction(
			() => this.messageHistory.act.slice(),
			actMessagesHistory => {
				setInLocalStorage('actMessagesHistory', JSON.stringify(actMessagesHistory));
			},
		);
	}
}
