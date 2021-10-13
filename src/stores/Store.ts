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

/* eslint-disable no-alert */
// eslint-disable-next-line import/no-extraneous-dependencies

import { JSONSchema4, JSONSchema7 } from 'json-schema';
import { action, computed, makeObservable, observable, reaction, runInAction } from 'mobx';
import { nanoid } from 'nanoid';
import api from '../api';
import { SchemaType } from '../components/Control';
import { Dictionary } from '../models/Dictionary';
import { ActSendingResponse, MessageSendingResponse, ParsedMessage } from '../models/Message';
import Service, { Method } from '../models/Service';
import { getFromLocalStorage, setInLocalStorage } from '../helpers/localStorageManager';
import ActMessageHistoryStore from './history/ActMessageHistoryStore';
import ParsedMessageHistoryStore from './history/ParsedMessageHistoryStore';

export default class Store {
	parsedMessageHistoryStore = new ParsedMessageHistoryStore(this);

	actMessageHistoryStore = new ActMessageHistoryStore(this);

	currentHistoryStore: ParsedMessageHistoryStore | ActMessageHistoryStore =
		this.parsedMessageHistoryStore;

	dictionaries: Array<string> = [];

	sessions: Array<string> = [];

	dictionary: Dictionary = [];

	selectedDictionaryName: string | null = null;

	selectedMessageType: string | null = null;

	selectedSession: string | null = null;

	parsedMessage: ParsedMessage | null = null;

	acts: Array<string> = [];

	selectedActBox: string | null = null;

	services: string[] = [];

	selectedService: string | null = null;

	serviceDetails: Service | null = null;

	selectedMethod: Method | null = null;

	actSchema: JSONSchema4 | null = null;

	selectedSchemaType: SchemaType = 'parsed-message';

	isSessionsLoading = false;

	isDictionariesLoading = false;

	isDictionaryLoading = false;

	isActsLoading = false;

	isServicesLoading = false;

	isMethodsLoading = false;

	isSending = false;

	isSchemaLoading = false;

	isSchemaApplied = false;

	constructor() {
		makeObservable(this, {
			currentHistoryStore: observable.ref,
			dictionaries: observable,
			sessions: observable,
			dictionary: observable,
			selectedDictionaryName: observable,
			selectedMessageType: observable,
			selectedSession: observable,
			parsedMessage: observable,
			acts: observable,
			selectedActBox: observable,
			services: observable,
			selectedService: observable,
			serviceDetails: observable,
			selectedMethod: observable,
			actSchema: observable,
			selectedSchemaType: observable,
			isSessionsLoading: observable,
			isDictionariesLoading: observable,
			isDictionaryLoading: observable,
			isActsLoading: observable,
			isServicesLoading: observable,
			isMethodsLoading: observable,
			isSending: observable,
			isSchemaLoading: observable,
			isSchemaApplied: observable,
			selectedSchema: computed,
			isSendingAllowed: computed,
			setSelectedMethod: action,
			startApp: action,
			setIsSchemaApplied: action,
			getDictionaries: action,
			getDictionary: action,
			getMessageSchema: action,
			getSessions: action,
			sendMessage: action,
			getActs: action,
			getServices: action,
			getServiceDetails: action,
			setSelectedSchemaType: action,
			getActSchema: action,
		});

		this.prepareApp().then(this.startApp);

		reaction(
			() => this.selectedActBox,
			selectedActBox => {
				if (selectedActBox) {
					this.getServices(selectedActBox);
				} else {
					runInAction(() => {
						this.services = [];
						this.selectedService = null;
					});
				}
				setInLocalStorage('selectedActBox', selectedActBox || '');
			},
		);

		reaction(
			() => this.selectedService,
			selectedService => {
				if (selectedService && this.selectedActBox) {
					this.getServiceDetails(selectedService);
					if (this.selectedMethod) {
						if (this.selectedMethod && this.selectedService && this.selectedActBox) {
							this.getActSchema(this.selectedService, this.selectedMethod.methodName);
						}
					}
				} else {
					this.serviceDetails = null;
					this.selectedMethod = null;
				}
				setInLocalStorage('selectedService', selectedService || '');
			},
		);

		reaction(
			() => this.selectedMethod,
			async selectedMethod => {
				if (selectedMethod && this.selectedService && this.selectedActBox) {
					this.getActSchema(this.selectedService, selectedMethod.methodName);
				}
				setInLocalStorage('selectedMethodName', selectedMethod?.methodName || '');
			},
		);

		reaction(
			() => this.selectedSession,
			selectedSession => {
				setInLocalStorage('selectedSessionId', selectedSession || '');
			},
		);

		reaction(
			() => this.selectedDictionaryName,
			dictinonaryName => {
				if (dictinonaryName) {
					this.getDictionary(dictinonaryName);
				}
				setInLocalStorage('selectedDictionaryName', dictinonaryName || '');
			},
		);

		reaction(
			() => this.selectedMessageType,
			messageType => {
				if (messageType && this.selectedDictionaryName) {
					this.getMessageSchema(messageType, this.selectedDictionaryName);
				} else {
					this.parsedMessage = null;
				}
				setInLocalStorage('selectedMessageType', messageType || '');
			},
		);
	}

	setSelectedMethod = (methodName: string | null) => {
		if (this.selectedService) {
			this.getServiceDetails(this.selectedService).then(() => {
				this.selectedMethod =
					this.serviceDetails?.methods.find(method => method.methodName === methodName) || null;
			});
		}
	};

	startApp = () => {
		this.selectedSession = getFromLocalStorage('selectedSessionId');
		this.selectedDictionaryName = getFromLocalStorage('selectedDictionaryName');
		this.selectedMessageType = getFromLocalStorage('selectedMessageType');
		this.selectedActBox = getFromLocalStorage('selectedActBox');
		this.selectedService = getFromLocalStorage('selectedService');
		this.setSelectedMethod(getFromLocalStorage('selectedMethodName'));

		this.setSelectedSchemaType(
			(getFromLocalStorage('selectedSchemaType') as SchemaType) || this.selectedSchemaType,
		);
	};

	prepareApp = async () => {
		this.getDictionaries();
		this.getSessions();
		this.getActs();
	};

	setIsSchemaApplied = (isApplied: boolean) => {
		this.isSchemaApplied = isApplied;
	};

	getDictionaries = async () => {
		try {
			const dictionaryList = await api.getDictionaryList();
			this.dictionaries = dictionaryList;
			if (dictionaryList.length === 1) {
				this.selectedDictionaryName = dictionaryList[0];
			}
		} catch (error) {
			console.error('Error occured while fetching dictionaries');
		}
	};

	getDictionary = async (dictionaryName: string) => {
		this.isDictionaryLoading = true;
		try {
			this.dictionary = await api.getDictionary(dictionaryName);
			if (this.selectedMessageType != null) {
				this.getMessageSchema(this.selectedMessageType, dictionaryName);
			}
		} catch (error) {
			console.error('Error occured while fetching dictionary');
		}
		this.isDictionaryLoading = false;
	};

	getMessageSchema = async (messageType: string, dictionaryName: string) => {
		this.isSchemaLoading = true;
		try {
			const message = await api.getMessage(messageType, dictionaryName);
			if (message === null) {
				localStorage.removeItem('selectedMessageType');
				this.selectedMessageType = null;
				this.parsedMessageHistoryStore.setEditorCode('{}');
			}
			this.parsedMessage = message;
		} catch (error) {
			console.error('Error occured while fetching message');
		}
		this.isSchemaLoading = false;
	};

	getSessions = async () => {
		this.isSessionsLoading = true;
		try {
			const sessions = await api.getSessions();
			this.sessions = sessions;
			if (sessions.length === 1) {
				this.selectedSession = sessions[0];
			}
		} catch (error) {
			console.error('Error occured while fetching sessions');
		}
		this.isSessionsLoading = false;
	};

	sendMessage = async (message: object): Promise<MessageSendingResponse | null> => {
		this.isSending = true;

		let result: MessageSendingResponse | ActSendingResponse | null = null;

		switch (this.selectedSchemaType) {
			case 'parsed-message': {
				if (!this.selectedDictionaryName || !this.selectedMessageType || !this.selectedSession) {
					this.isSending = false;
					return null;
				}

				result = await api.sendMessage({
					session: this.selectedSession,
					dictionary: this.selectedDictionaryName,
					messageType: this.selectedMessageType,
					message,
				});

				this.parsedMessageHistoryStore.addMessage({
					id: nanoid(),
					sessionId: this.selectedSession,
					dictionary: this.selectedDictionaryName,
					messageType: this.selectedMessageType,
					message: JSON.stringify(message, null, 4),
					delay: 0,
					indicator: 'indicator_unvisible',
				});
				break;
			}
			case 'act': {
				if (!this.selectedActBox || !this.selectedService || !this.selectedMethod) {
					this.isSending = false;
					return null;
				}

				result = await api.callMethod({
					fullServiceName: this.selectedService,
					methodName: this.selectedMethod.methodName,
					message,
				});

				this.actMessageHistoryStore.addMessage({
					id: nanoid(),
					actBox: this.selectedActBox,
					fullServiceName: this.selectedService,
					methodName: this.selectedMethod.methodName,
					message: JSON.stringify(message, null, 4),
					delay: 0,
					indicator: 'indicator_unvisible',
				});
				break;
			}
			default:
		}
		this.isSending = false;

		return result;
	};

	getActs = async () => {
		this.isActsLoading = true;
		try {
			const actsList = await api.getActsList();
			this.acts = actsList;
			if (actsList.length === 1) {
				this.selectedActBox = actsList[0];
			}
		} catch (error) {
			console.error('Error occured while fetching acts');
		}
		this.isActsLoading = false;
	};

	getServices = async (actBox: string) => {
		this.isServicesLoading = true;
		try {
			const services = await api.getServices(actBox);
			this.services = services;
			if (services.length === 1) {
				this.selectedService = services[0];
			}
		} catch (error) {
			console.error('Error occured while fetching services');
		}
		this.isServicesLoading = false;
	};

	getServiceDetails = async (serviceName: string) => {
		this.isMethodsLoading = true;
		try {
			const serviceDetails = await api.getServiceDetails(serviceName);
			if (!serviceDetails) return;

			this.serviceDetails = serviceDetails;
			if (serviceDetails.methods.length === 1) {
				this.selectedMethod = serviceDetails.methods[0];
			}
		} catch (error) {
			console.error('Error occured while fetching service details');
		}
		this.isMethodsLoading = false;
	};

	setSelectedSchemaType = (type: SchemaType) => {
		setInLocalStorage('selectedSchemaType', type);
		this.selectedSchemaType = type;
		this.setIsSchemaApplied(false);

		this.currentHistoryStore =
			type === 'parsed-message' ? this.parsedMessageHistoryStore : this.actMessageHistoryStore;
	};

	get selectedSchema() {
		switch (this.selectedSchemaType) {
			case 'parsed-message':
				return this.parsedMessage
					? (this.parsedMessage[Object.keys(this.parsedMessage)[0]] as JSONSchema7)
					: null;
			case 'act':
				return this.actSchema;
			default:
				throw new Error('');
		}
	}

	getActSchema = async (serviceName: string, methodName: string) => {
		this.isSchemaLoading = true;
		if (!this.selectedMethod) return;
		try {
			const actMessage = await api.getActSchema(serviceName, methodName);
			if (!actMessage) {
				this.actSchema = null;
				this.selectedMethod = null;
				return;
			}

			this.actSchema = actMessage[this.selectedMethod.inputType] as unknown as JSONSchema4;
		} catch (error) {
			console.error('Error occured while fetching act schema');
		}
		this.isSchemaLoading = false;
	};

	get isSendingAllowed(): boolean {
		switch (this.selectedSchemaType) {
			case 'parsed-message': {
				return !!(
					!this.isSending &&
					this.selectedSession &&
					this.selectedDictionaryName &&
					this.selectedMessageType
				);
			}
			case 'act': {
				return !!(
					!this.isSending &&
					this.selectedActBox &&
					this.selectedService &&
					this.selectedMethod
				);
			}
			default:
				return false;
		}
	}
}
