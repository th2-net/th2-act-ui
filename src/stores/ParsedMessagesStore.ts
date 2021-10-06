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

import { action, reaction } from 'mobx';
import { isParsedMessageItem, ParsedMessageItem } from '../models/Message';
import Store from './Store';
import { getFromLocalStorage, setInLocalStorage } from '../helpers/localStorageManager';
import MessageListStore from './MessageListStore';

export default class ParsedMessagesStore extends MessageListStore<ParsedMessageItem> {
	buildEditedMessage = (id: string): ParsedMessageItem | undefined => {
		if (
			this.store.selectedSession
			&& this.store.selectedDictionaryName
			&& this.store.selectedMessageType
		) {
			return {
				id,
				sessionId: this.store.selectedSession,
				dictionary: this.store.selectedDictionaryName,
				messageType: this.store.selectedMessageType,
				message: this.editorCode,
				delay: this.editedMessageSendDelay,
				indicator: 'indicator_edited',
			};
		}
		return undefined;
	};

	@action selectMessage = (id: string) => {
		const selectedMessage = this.messagesHistory.find(
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

	setEditorProperties = (
		session: string | null,
		dictionary: string | null,
		messageType: string | null,
		editorCode: string,
	) => {
		this.store.selectedSession = session;
		this.store.selectedDictionaryName = dictionary;
		this.store.selectedMessageType = messageType;

		if (editorCode) {
			this.setEditorCode(editorCode);
		}
	};

	@action setEditedMessageId = (id: string) => {
		this.editedMessageId = id;
		setInLocalStorage('editedParsedMessageId', id);
	};

	@action setEditMessageMode = (mode: boolean) => {
		this.editMessageMode = mode;

		if (!mode) {
			this.setEditedMessageId('');
		}

		setInLocalStorage('editParsedMessageMode', mode.toString());
	};

	prepare = () => {
		this.setEditMessageMode(getFromLocalStorage('editParsedMessageMode') === 'true');
		this.editedMessageId = getFromLocalStorage('editedParsedMessageId') || '';
	};

	constructor(private store: Store) {
		super();

		reaction(
			() => this.messagesHistory,
			messagesHistory => {
				setInLocalStorage('parsedMessagesHistory', JSON.stringify(messagesHistory));
			},
		);
	}

	@action loadMessageFromJSON = (jsonString: string) => {
		try {
			const messages = JSON.parse(jsonString) as Array<ParsedMessageItem>;
			this.clearMessages();

			messages.forEach(message => {
				if (!isParsedMessageItem(message)) {
					throw Error('Failed to read the file. Please, try to select another file');
				}

				this.addMessage(message);
			});
		} catch (error) {
			console.error(error);
		}
	};

	init = () => {
		const parsedMessageList = getFromLocalStorage('parsedMessagesHistory') || '[]';
		localStorage.removeItem('parsedMessagesHistory');

		this.messagesHistory = JSON.parse(parsedMessageList);
	};
}
