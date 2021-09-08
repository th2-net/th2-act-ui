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

	@observable editedMessageId = '';

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
		if (this.editedMessageId !== '') {
			const message: ParsedMessageItem | ActMessageItem | undefined = this.buildEditedMessage();
			if (message !== undefined) {
				message.id = nanoid();
				if (
					this.store.selectedSchemaType === 'parsed-message'
					&& isParsedMessageItem(message)
				) {
					for (let i = 0; i < this.parsedMessagesHistory.length; i++) {
						if (this.parsedMessagesHistory[i].id === this.editedMessageId) {
							this.parsedMessagesHistory[i] = message;
							this.indicators[i] = 'indicator-edited';
							break;
						}
					}
				} else if (this.store.selectedSchemaType === 'act' && isActMessageItem(message)) {
					for (let i = 0; i < this.actMessagesHistory.length; i++) {
						if (this.actMessagesHistory[i].id === this.editedMessageId) {
							this.actMessagesHistory[i] = message;
							this.indicators[i] = 'indicator-edited';
							break;
						}
					}
				}
			}
			this.setEditMessageMode(false);
		}
	};

	@action selectMessage = (id: string) => {
		if (this.store.selectedSchemaType === 'parsed-message') {
			for (let i = 0; i < this.parsedMessagesHistory.length; i++) {
				if (this.parsedMessagesHistory[i].id === id) {
					this.setEditorProperties(
						this.parsedMessagesHistory[i].sessionId,
						this.parsedMessagesHistory[i].dictionary,
						this.parsedMessagesHistory[i].messageType,
						this.parsedMessagesHistory[i].message as string,
					);
					break;
				}
			}
		} else if (this.store.selectedSchemaType === 'act') {
			for (let i = 0; i < this.actMessagesHistory.length; i++) {
				if (this.actMessagesHistory[i].id === id) {
					this.setEditorProperties(
						this.actMessagesHistory[i].actBox,
						this.actMessagesHistory[i].fullServiceName,
						this.actMessagesHistory[i].methodName,
						this.actMessagesHistory[i].message as string,
					);
					break;
				}
			}
		}
		this.setEditMessageMode(true);
		this.setEditedMessageId(id);
	};

	@action addParsedMessage = (
		message: ParsedMessageItem | ActMessageItem,
		indicatorClass?: Indicator,
	) => {
		this.addIndicator(indicatorClass || 'indicator-unvisible');
		const messageWithId: ParsedMessageItem | ActMessageItem = message;
		if (!messageWithId.id) {
			messageWithId.id = nanoid();
		}
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

	prepareForSelectedSchemaType = (type: SchemaType) => {
		switch (type) {
			case 'parsed-message':
				this.parsedMessagesHistory.forEach(() => this.addIndicator('indicator-unvisible'));

				this.setEditMessageMode(getFromLocalStorage('editParsedMessageMode') === 'true');

				this.editedMessageId = getFromLocalStorage('editedParsedMessageId') || '';
				break;
			case 'act':
				this.actMessagesHistory.forEach(() => this.addIndicator('indicator-unvisible'));

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
