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
import { SchemaType } from '../components/message-editor/Control';
import { Method } from '../models/Service';

enum localStorageKeys {
	SELECTED_SCHEMA_TYPE = 'selectedSchemaType',
	PARSED_MESSAGE_REPLAY = 'parsedMessagesReplay',
	ACT_MESSAGE_REPLAY = 'actMessagesReplay',
	SELECTED_SESSION_ID = 'selectedSessionId',
	SELECTED_DICTIONARY_NAME = 'selectedDictionaryName',
	SELECTED_MESSAGE_TYPE = 'selectedMessageType',
	SELECTED_ACT_BOX = 'selectedActBox',
	SELECTED_SERVICE = 'selectedService',
	SELECTED_METHOD_NAME = 'selectedMethodName',
}

class LocalStorageWorker {
	getParsedMessageReplay() {
		const replay = JSON.parse(localStorage.getItem(localStorageKeys.PARSED_MESSAGE_REPLAY) ?? '[]');

		return Array.isArray(replay) ? replay.filter(isParsedMessageReplayItem) : [];
	}

	getActReplay() {
		const replay = JSON.parse(localStorage.getItem(localStorageKeys.ACT_MESSAGE_REPLAY) ?? '[]');
		return Array.isArray(replay) ? replay.filter(isActReplayItem) : [];
	}

	getSelectedSessionId(): string | null {
		return localStorage.getItem(localStorageKeys.SELECTED_SESSION_ID);
	}

	getSelectedDictionaryName(): string | null {
		return localStorage.getItem(localStorageKeys.SELECTED_DICTIONARY_NAME);
	}

	getSelectedActBox(): string | null {
		return localStorage.getItem(localStorageKeys.SELECTED_ACT_BOX);
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

	setParsedMessageReplay(replay: ParsedMessageReplayItem[]) {
		localStorage.setItem(localStorageKeys.PARSED_MESSAGE_REPLAY, JSON.stringify(replay));
	}

	setActReplay(replay: ActReplayItem[]) {
		localStorage.setItem(localStorageKeys.ACT_MESSAGE_REPLAY, JSON.stringify(replay));
	}

	setSelectedSessionId(id: string) {
		return localStorage.setItem(localStorageKeys.SELECTED_SESSION_ID, id);
	}

	setSelectedDictionaryName(dictionaryName: string) {
		return localStorage.setItem(localStorageKeys.SELECTED_DICTIONARY_NAME, dictionaryName);
	}

	setSelectedActBox(actBox: string) {
		return localStorage.setItem(localStorageKeys.SELECTED_ACT_BOX, actBox);
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
