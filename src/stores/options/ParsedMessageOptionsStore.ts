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

import { action, flow, makeObservable, observable, reaction } from 'mobx';
import { JSONSchema7 } from 'json-schema';
import { ParsedMessage } from '../../models/Message';
import api from '../../api';
import localStorageWorker from '../../helpers/localStorageWorker';
import makeSchemaFieldsOptional from '../../helpers/makeFieldsOptional';

export type ParsedMessageOptions = {
	session: string;
	dictionary: string;
	messageType: string;
};

export default class ParsedMessageOptionsStore {
	isSessionsLoading = false;

	sessions: string[] = [];

	selectedSession: string | null = null;

	isDictionariesLoading = false;

	dictionaries: string[] = [];

	selectedDictionary: string | null = null;

	isMessageTypesLoading = false;

	messageTypes: string[] = [];

	selectedMessageType: string | null = null;

	isSchemaLoading = false;

	schema: JSONSchema7 | null = null;

	constructor() {
		makeObservable(this, {
			isSessionsLoading: observable,
			sessions: observable,
			selectedSession: observable,
			isDictionariesLoading: observable,
			dictionaries: observable,
			selectedDictionary: observable,
			isMessageTypesLoading: observable,
			messageTypes: observable,
			selectedMessageType: observable,
			isSchemaLoading: observable,
			schema: observable,
			selectSession: action,
			selectDictionary: action,
			selectMessageType: action,
		});

		reaction(
			() => this.selectedSession,
			session => {
				if (session) {
					this.resetDictionary();
					this.resetMessageTypes();
					this.resetSchema();
					this.fetchDictionaries(session);
					localStorageWorker.setSelectedSessionId(session);
				}
			},
		);

		reaction(
			() => this.selectedDictionary,
			dictionary => {
				if (dictionary) {
					this.resetMessageTypes();
					this.resetSchema();
					this.fetchMessageTypes(dictionary);
					localStorageWorker.setSelectedDictionaryName(dictionary);
				}
			},
		);

		reaction(
			() => this.selectedMessageType,
			messageType => {
				if (messageType && this.selectedDictionary) {
					this.resetSchema();
					this.fetchSchema(messageType, this.selectedDictionary);
					localStorageWorker.setSelectedMessageType(messageType);
				}
			},
		);
	}

	private resetMessageTypes = () => {
		this.messageTypes = [];
		this.selectedMessageType = null;
	};

	private resetSchema = () => {
		this.schema = null;
	};

	private resetDictionary = () => {
		this.selectedDictionary = null;
	};

	selectSession = (session: string) => {
		this.selectedSession = session;
	};

	selectDictionary = (dictionaryName: string) => {
		this.selectedDictionary = dictionaryName;
	};

	selectMessageType = (messageType: string) => {
		this.selectedMessageType = messageType;
	};

	fetchSessions = flow(function* (this: ParsedMessageOptionsStore) {
		this.isSessionsLoading = true;

		try {
			this.sessions = yield api.getSessions();
			this.sessions.sort();
		} catch (error) {
			console.error('Error occurred while fetching sessions');
		} finally {
			this.isSessionsLoading = false;
		}
	});

	fetchDictionaries = flow(function* (this: ParsedMessageOptionsStore, sessionName: string) {
		this.isDictionariesLoading = true;

		try {
			this.dictionaries = yield api.getDictionaryList(sessionName);
			this.dictionaries.sort();
		} catch (error) {
			console.error('Error occurred while fetching dictionaries');
		} finally {
			this.isDictionariesLoading = false;
		}
	});

	fetchMessageTypes = flow(function* (this: ParsedMessageOptionsStore, dictionaryName: string) {
		this.isMessageTypesLoading = true;

		try {
			this.messageTypes = yield api.getDictionary(dictionaryName);
			this.messageTypes.sort();
		} catch (error) {
			console.error('Error occurred while fetching dictionary');
		}
		this.isMessageTypesLoading = false;
	});

	fetchSchema = flow(function* (this: ParsedMessageOptionsStore, messageType: string, dictionaryName: string) {
		this.isSchemaLoading = true;

		try {
			const message: ParsedMessage | null = yield api.getMessage(messageType, dictionaryName);
			const schema = message ? (message[Object.keys(message)[0]] as JSONSchema7) : null;

			if (schema) {
				this.schema = makeSchemaFieldsOptional(schema, ['header', 'trailer']);
			}
		} catch (error) {
			console.error('Error occurred while fetching message');
		}
		this.isSchemaLoading = false;
	});

	get allOptionsSelected() {
		return !!(this.selectedSession && this.selectedDictionary && this.selectedMessageType);
	}

	get selectedOptions(): ParsedMessageOptions | null {
		if (!this.allOptionsSelected) return null;

		return {
			session: this.selectedSession as string,
			dictionary: this.selectedDictionary as string,
			messageType: this.selectedMessageType as string,
		};
	}

	init = flow(function* (this: ParsedMessageOptionsStore) {
		const savedSession = localStorageWorker.getSelectedSessionId();
		const savedDictionaryName = localStorageWorker.getSelectedDictionaryName();
		const savedMessageType = localStorageWorker.getSelectedMessageType();

		yield this.fetchSessions();

		if (savedSession) {
			this.selectSession(savedSession);
		} else return;

		yield this.fetchDictionaries(savedSession);

		if (savedDictionaryName) {
			this.selectDictionary(savedDictionaryName);
		} else return;

		yield this.fetchMessageTypes(savedDictionaryName);

		if (savedMessageType) {
			this.selectMessageType(savedMessageType);
		}
	});
}
