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
import { nanoid } from '../../node_modules/nanoid';
import {
	ParsedMessageItem,
	ActMessageItem,
	isParsedMessageItem,
	isActMessageItem,
} from '../models/Message';
import Store from './Store';
import { Indicator } from '../components/MessageList';
import { setInLocalStorage, getFromLocalStorage } from '../helpers/localStorageManager';

export default class MessageListDataStore {
	@observable parsedMessagesHistory: ParsedMessageItem[] = [];

	@observable actMessagesHistory: ActMessageItem[] = [];

	@observable indicators: Indicator[] = [];

	@observable editorCode = '{}';

	@observable editMessageMode = false;

	@observable editedMessageIndex = -1;

	@observable editedMessageSendDelay = 0;

	buildEditedMessage = (): ParsedMessageItem | ActMessageItem | undefined => {
		if (this.store.selectedSchemaType === 'parsed-message') {
			if (
				this.store.selectedSession
				&& this.store.selectedDictionaryName
				&& this.store.selectedMessageType
			) {
				const editedMessage: ParsedMessageItem = {
					sessionId: this.store.selectedSession,
					dictionary: this.store.selectedDictionaryName,
					messageType: this.store.selectedMessageType,
					message: this.editorCode,
					delay: this.editedMessageSendDelay,
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
					actBox: this.store.selectedActBox,
					fullServiceName: this.store.selectedService,
					methodName: this.store.selectedMethod?.methodName,
					message: this.editorCode,
					delay: this.editedMessageSendDelay,
				};
				return editedMessage;
			}
			return undefined;
		}
		return undefined;
	};

	@action saveEditedMessage = () => {
		if (this.editedMessageIndex >= 0) {
			const message: ParsedMessageItem | ActMessageItem | undefined = this.buildEditedMessage();
			if (message !== undefined) {
				message.id = nanoid();
				if (
					this.store.selectedSchemaType === 'parsed-message'
					&& isParsedMessageItem(message)
				) {
					this.parsedMessagesHistory[this.editedMessageIndex] = message;
				} else if (this.store.selectedSchemaType === 'act' && isActMessageItem(message)) {
					this.actMessagesHistory[this.editedMessageIndex] = message;
				}
				this.indicators[this.editedMessageIndex] = 'indicator-edited';
			}
			this.setEditMessageMode(false);
		}
	};

	@action selectMessage = (index: number) => {
		if (this.store.selectedSchemaType === 'parsed-message') {
			this.setEditorProperties(
				this.parsedMessagesHistory[index].sessionId,
				this.parsedMessagesHistory[index].dictionary,
				this.parsedMessagesHistory[index].messageType,
				this.parsedMessagesHistory[index].message as string,
			);
		} else if (this.store.selectedSchemaType === 'act') {
			this.setEditorProperties(
				this.actMessagesHistory[index].actBox,
				this.actMessagesHistory[index].fullServiceName,
				this.actMessagesHistory[index].methodName,
				this.actMessagesHistory[index].message as string,
			);
		}
		this.setEditMessageMode(true);
		this.setEditedMessageIndex(index);
	};

	@action addParsedMessage = (
		message: ParsedMessageItem | ActMessageItem,
		indicatorClass?: Indicator,
	) => {
		this.addIndicator(indicatorClass || 'indicator-unvisible');
		const messageWithId: ParsedMessageItem | ActMessageItem = message;
		messageWithId.id = nanoid();
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
		this.indicators = [];

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
		for (let i = 0; i < this.indicators.length; i++) {
			this.indicators[i] = 'indicator-unvisible';
		}
	};

	@action addIndicator = (indicatorClass: Indicator) => {
		this.indicators.push(indicatorClass);
	};

	@action changeIndicator = (index: number, indicatorClass: Indicator) => {
		this.indicators[index] = indicatorClass;
	};

	@action deleteIndicator = (index: number): Indicator[] => {
		const tmpArray: Indicator[] = this.indicators.slice();
		this.indicators = [];
		tmpArray.forEach((item, i) => {
			if (i !== index) {
				this.addIndicator(item);
			}
		});
		return this.indicators;
	};

	@action setEditedMessageSendDelay = (delay: number) => {
		this.editedMessageSendDelay = delay;
	};

	@observable setEditedMessageIndex = (index: number) => {
		this.editedMessageIndex = index;
		if (this.store.selectedSchemaType === 'parsed-message') {
			setInLocalStorage('editedParsedMessageIndex', index.toString());
		} else if (this.store.selectedSchemaType === 'act') {
			setInLocalStorage('editedActMessageIndex', index.toString());
		}
	};

	@action setEditMessageMode = (mode: boolean) => {
		this.editMessageMode = mode;
		if (mode === false) {
			this.setEditedMessageIndex(-1);
		}
		if (this.store.selectedSchemaType === 'parsed-message') {
			setInLocalStorage('editParsedMessageMode', mode.toString());
		} else if (this.store.selectedSchemaType === 'act') {
			setInLocalStorage('editActMessageMode', mode.toString());
		}
	};

	prepareForSelectedSchemaType = (type: SchemaType) => {
		switch (type) {
			case 'parsed-message':
				this.parsedMessagesHistory.forEach(() => this.addIndicator('indicator-unvisible'));

				this.setEditMessageMode(getFromLocalStorage('editParsedMessageMode') === 'true');

				this.editedMessageIndex = Number(getFromLocalStorage('editedParsedMessageIndex')) || -1;
				break;
			case 'act':
				this.actMessagesHistory.forEach(() => this.addIndicator('indicator-unvisible'));

				this.setEditMessageMode(getFromLocalStorage('editActMessageMode') === 'true');

				this.editedMessageIndex = Number(getFromLocalStorage('editedActMessageIndex')) || -1;

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
