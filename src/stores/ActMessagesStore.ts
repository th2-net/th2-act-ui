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
import { ActMessageItem } from '../models/Message';
import Store from './Store';
import { setInLocalStorage, getFromLocalStorage } from '../helpers/localStorageManager';
import { Indicator } from '../components/MessageList';
import MessageListStore from './MessageListStore';

export default class ActMessagesStore extends MessageListStore<ActMessageItem> {
	@observable actMessagesHistory: ActMessageItem[] = [];

	@observable editorCode = '{}';

	@observable editMessageMode = false;

	@observable editedMessageId = '';

	@observable editedMessageSendDelay = 0;

	buildEditedMessage = (id: string): ActMessageItem | undefined => {
		if (this.store.selectedActBox && this.store.selectedService && this.store.selectedMethod) {
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
	};

	@action saveEditedMessage = () => {
		if (this.editedMessageId !== '') {
			const editedMessage = this.buildEditedMessage(this.editedMessageId);
			if (editedMessage !== undefined) {
				this.actMessagesHistory = this.actMessagesHistory.map(message =>
					(message.id === this.editedMessageId ? editedMessage : message));
			}
			this.setEditMessageMode(false);
		}
	};

	@action selectMessage = (id: string) => {
		const selectedMessage = this.actMessagesHistory.find(
			message => message.id === id,
		) as ActMessageItem;

		this.setEditorProperties(
			selectedMessage.actBox,
			selectedMessage.fullServiceName,
			selectedMessage.methodName,
			selectedMessage.message as string,
		);
		this.setEditMessageMode(true);
		this.setEditedMessageId(id);
	};

	@action addMessage = (message: ActMessageItem) => {
		this.actMessagesHistory.push({ ...message, indicator: 'indicator_unvisible' });
	};

	@action clearMessageHistory = () => {
		this.actMessagesHistory = [];

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
		this.store.selectedActBox = sessionOrActBox;
		this.store.selectedService = dictionaryOrService;
		this.store.setSelectedMethod(messageTypeOrMethod);

		if (editorCode) {
			this.setEditorCode(editorCode);
		}
	};

	@action clearIndicators = () => {
		this.actMessagesHistory.map(message => ({
			...message,
			indicator: 'indicator_unvisible',
		}));
	};

	@action changeIndicator = (id: string, indicator: Indicator) => {
		this.actMessagesHistory = this.actMessagesHistory.map(message =>
			(message.id === id ? { ...message, indicator } : message));
	};

	@action setEditedMessageSendDelay = (delay: number) => {
		if (delay >= 0) {
			this.editedMessageSendDelay = delay;
		}
	};

	@observable setEditedMessageId = (id: string) => {
		this.editedMessageId = id;
		setInLocalStorage('editedActMessageId', id);
	};

	@action setEditMessageMode = (mode: boolean) => {
		this.editMessageMode = mode;
		if (mode === false) {
			this.setEditedMessageId('');
		}
		setInLocalStorage('editActMessageMode', mode.toString());
	};

	@action deleteMessage = (id: string) => {
		this.actMessagesHistory = this.actMessagesHistory.filter(message => message.id !== id);
	};

	prepareForSelectedSchemaType = () => {
		this.setEditMessageMode(getFromLocalStorage('editActMessageMode') === 'true');
		this.editedMessageId = getFromLocalStorage('editedActMessageId') || '';
	};

	constructor(private store: Store) {
		super();
		reaction(
			() => this.actMessagesHistory.slice(),
			actMessagesHistory => {
				setInLocalStorage('actMessagesHistory', JSON.stringify(actMessagesHistory));
			},
		);
	}
}
