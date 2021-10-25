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

import { ActReplayItem, isActReplayItem, isParsedMessageReplayItem, ParsedMessageReplayItem } from '../models/Message';
import { SchemaType } from '../components/Control';
import { Method } from '../models/Service';

enum localStorageKeys {
	PARSED_MESSAGE_HISTORY = 'parsedMessagesHistory',
	ACT_MESSAGE_HISTORY = 'actMessagesHistory',
	SELECTED_SESSION_ID = 'selectedSessionId',
	SELECTED_DICTIONARY_NAME = 'selectedDictionaryName',
	EDIT_PARSED_MESSAGE_MODE = 'editParsedMessageMode',
	EDIT_ACT_MESSAGE_MODE = 'editActMessageMode',
	SELECTED_ACT_BOX = 'selectedActBox',
	EDITED_PARSED_MESSAGE_ID = 'editedParsedMessageId',
	EDITED_ACT_MESSAGE_ID = 'editedActMessageId',
	SELECTED_SERVICE = 'selectedService',
	SELECTED_MESSAGE_TYPE = 'selectedMessageType',
	SELECTED_METHOD_NAME = 'selectedMethodName',
	SELECTED_SCHEMA_TYPE = 'selectedSchemaType',
}

class LocalStorageWorker {
	getParsedMessageHistory() {
		const history = JSON.parse(localStorage.getItem(localStorageKeys.PARSED_MESSAGE_HISTORY) ?? '[]');

		return Array.isArray(history) ? history.filter(isParsedMessageReplayItem) : [];
	}

	getActMessageHistory() {
		const history = JSON.parse(localStorage.getItem(localStorageKeys.ACT_MESSAGE_HISTORY) ?? '[]');
		return Array.isArray(history) ? history.filter(isActReplayItem) : [];
	}

	getSelectedSessionId(): string | null {
		return localStorage.getItem(localStorageKeys.SELECTED_SESSION_ID);
	}

	getSelectedDictionaryName(): string | null {
		return localStorage.getItem(localStorageKeys.SELECTED_DICTIONARY_NAME);
	}

	getEditParsedMessageMode(): boolean {
		return localStorage.getItem(localStorageKeys.EDIT_PARSED_MESSAGE_MODE) === 'true';
	}

	getEditActMessageMode(): boolean {
		return localStorage.getItem(localStorageKeys.EDIT_ACT_MESSAGE_MODE) === 'true';
	}

	getSelectedActBox(): string | null {
		return localStorage.getItem(localStorageKeys.SELECTED_ACT_BOX);
	}

	getEditedParsedMessageId(): string | null {
		return localStorage.getItem(localStorageKeys.EDITED_PARSED_MESSAGE_ID);
	}

	getEditedActMessageId(): string | null {
		return localStorage.getItem(localStorageKeys.EDITED_ACT_MESSAGE_ID);
	}

	getSelectedService(): string | null {
		return localStorage.getItem(localStorageKeys.SELECTED_SERVICE);
	}

	getSelectedMessageType(): string | null {
		return localStorage.getItem(localStorageKeys.SELECTED_MESSAGE_TYPE);
	}

	getSelectedMethod(): Method | null {
		const method = localStorage.getItem(localStorageKeys.SELECTED_METHOD_NAME);
		return method ? JSON.parse(method) : null;
	}

	getSelectedSchemaType(): SchemaType {
		const schemaType = localStorage.getItem(localStorageKeys.SELECTED_SCHEMA_TYPE);
		return schemaType === 'parsedMessage' || schemaType === 'act' ? schemaType : 'parsedMessage';
	}

	setParsedMessageHistory(messageHistory: ParsedMessageReplayItem[]) {
		localStorage.setItem(localStorageKeys.PARSED_MESSAGE_HISTORY, JSON.stringify(messageHistory));
	}

	setActMessageHistory(messageHistory: ActReplayItem[]) {
		localStorage.setItem(localStorageKeys.ACT_MESSAGE_HISTORY, JSON.stringify(messageHistory));
	}

	setSelectedSessionId(id: string) {
		return localStorage.setItem(localStorageKeys.SELECTED_SESSION_ID, id);
	}

	setSelectedDictionaryName(dictionaryName: string) {
		return localStorage.setItem(localStorageKeys.SELECTED_DICTIONARY_NAME, dictionaryName);
	}

	setEditParsedMessageMode(mode: boolean) {
		return localStorage.setItem(localStorageKeys.EDIT_PARSED_MESSAGE_MODE, mode.toString());
	}

	setEditActMessageMode(mode: boolean) {
		return localStorage.setItem(localStorageKeys.EDIT_ACT_MESSAGE_MODE, mode.toString());
	}

	setSelectedActBox(actBox: string) {
		return localStorage.setItem(localStorageKeys.SELECTED_ACT_BOX, actBox);
	}

	setEditedParsedMessageId(id: string | null) {
		if (id) {
			localStorage.setItem(localStorageKeys.EDITED_PARSED_MESSAGE_ID, id);
		} else {
			localStorage.removeItem(localStorageKeys.EDITED_PARSED_MESSAGE_ID);
		}
	}

	setEditedActMessageId(id: string | null) {
		if (id) {
			localStorage.setItem(localStorageKeys.EDITED_ACT_MESSAGE_ID, id);
		} else {
			localStorage.removeItem(localStorageKeys.EDITED_ACT_MESSAGE_ID);
		}
	}

	setSelectedService(service: string) {
		return localStorage.setItem(localStorageKeys.SELECTED_SERVICE, service);
	}

	setSelectedMessageType(type: string) {
		return localStorage.setItem(localStorageKeys.SELECTED_MESSAGE_TYPE, type);
	}

	setSelectedMethod(method: Method) {
		return localStorage.setItem(localStorageKeys.SELECTED_METHOD_NAME, JSON.stringify(method));
	}

	setSelectedSchemaType(type: string) {
		return localStorage.setItem(localStorageKeys.SELECTED_SCHEMA_TYPE, type);
	}
}

const localStorageWorker = new LocalStorageWorker();

export default localStorageWorker;
