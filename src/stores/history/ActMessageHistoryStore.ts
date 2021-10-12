/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
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

import { action, makeObservable, reaction } from 'mobx';
import MessageHistoryStore from './MessageHistoryStore';
import { ActMessageHistoryItem } from '../../models/Message';
import Store from '../Store';
import { getFromLocalStorage, setInLocalStorage } from '../../helpers/localStorageManager';
import api from '../../api';

export default class ActMessageHistoryStore extends MessageHistoryStore<ActMessageHistoryItem> {
	constructor(store: Store) {
		super(store);

		makeObservable(this, {
			selectMessage: action,
			replayMessage: action,
		});

		this.history = JSON.parse(getFromLocalStorage('actMessagesHistory') || '[]');
		this.setEditMessageMode(getFromLocalStorage('editActMessageMode') === 'true');
		this.editedMessageId = getFromLocalStorage('editedActMessageId') || '';

		reaction(
			() => this.history,
			actMessagesHistory => {
				setInLocalStorage('actMessagesHistory', JSON.stringify(actMessagesHistory));
			},
		);

		reaction(
			() => this.editedMessageId,
			editedMessageId => setInLocalStorage('editedActMessageId', editedMessageId),
		);

		reaction(
			() => this.editMessageMode,
			editMessageMode => setInLocalStorage('editActMessageMode', editMessageMode.toString()),
		);
	}

	buildEditedMessage = (id: string): ActMessageHistoryItem | undefined => {
		if (this.store.selectedActBox && this.store.selectedService && this.store.selectedMethod) {
			return {
				id,
				actBox: this.store.selectedActBox,
				fullServiceName: this.store.selectedService,
				methodName: this.store.selectedMethod?.methodName,
				message: this.editorCode,
				delay: this.editedMessageSendDelay,
				indicator: 'indicator_edited',
			};
		}
		return undefined;
	};

	selectMessage = (id: string) => {
		const selectedMessage = this.history.find(
			message => message.id === id,
		) as ActMessageHistoryItem;

		this.setEditorProperties(
			selectedMessage.actBox,
			selectedMessage.fullServiceName,
			selectedMessage.methodName,
			selectedMessage.message as string,
		);

		this.setEditMessageMode(true);
		this.setEditedMessageId(id);
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

	replayMessage = async (id: string): Promise<void> => {
		const message = this.history.find(msg => msg.id === id);

		if (message) {
			try {
				const result = await api.callMethod({
					fullServiceName: message.fullServiceName,
					methodName: message.methodName,
					message: JSON.parse(message.message as string),
				});

				message.indicator = result.code === 200 ? 'indicator_successful' : 'indicator_unsuccessful';
			} catch (error) {
				// eslint-disable-next-line no-alert
				alert('Error while sending');
				message.indicator = 'indicator_unsuccessful';
			}
		}
	};
}
