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
import { action, observable } from 'mobx';
import { MessageItem } from '../models/Message';
import { Indicator } from '../components/MessageList';

export default abstract class MessageListStore<T extends MessageItem> {
	@observable messagesHistory: T[] = [];

	@observable editorCode = '{}';

	@observable editMessageMode = false;

	@observable editedMessageId = '';

	@observable editedMessageSendDelay = 0;

	abstract buildEditedMessage: (id: string) => T | undefined;

	@action saveEditedMessage = () => {
		if (this.editedMessageId !== '') {
			const editedMessage = this.buildEditedMessage(this.editedMessageId);

			if (editedMessage !== undefined) {
				this.messagesHistory = this.messagesHistory.map(message =>
					(message.id === this.editedMessageId ? editedMessage : message));
			}

			this.setEditMessageMode(false);
		}
	};

	abstract selectMessage: (id: string) => void;

	@action addMessage = (message: T) => {
		const messageWithId = message;
		messageWithId.indicator = 'indicator_unvisible';

		this.messagesHistory.push(messageWithId);
	};

	@action clearMessages = () => {
		this.messagesHistory = [];

		if (this.editMessageMode) {
			this.setEditMessageMode(false);
		}
	};

	@action setEditorCode = (code: string) => {
		this.editorCode = code;
	};

	@action clearIndicators = () => {
		this.messagesHistory = this.messagesHistory.map(message => ({
			...message,
			indicator: 'indicator_unvisible',
		}));
	};

	@action changeIndicator = (id: string, indicator: Indicator) => {
		this.messagesHistory = this.messagesHistory.map(message =>
			(message.id === id ? { ...message, indicator } : message));
	};

	@action setEditedMessageSendDelay = (delay: number) => {
		if (delay >= 0) {
			this.editedMessageSendDelay = delay;
		}
	};

	abstract setEditedMessageId: (id: string) => void;

	abstract setEditMessageMode: (mode: boolean) => void;

	@action deleteMessage = (id: string) => {
		this.messagesHistory = this.messagesHistory.filter(
			message => message.id !== id,
		);
	};

	abstract loadMessageFromJSON: (jsonString: string) => void;

	abstract prepare: () => void;

	abstract init: () => void;
}
