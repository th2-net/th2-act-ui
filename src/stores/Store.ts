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

// eslint-disable-next-line import/no-extraneous-dependencies
import { JSONSchema4, JSONSchema7 } from 'json-schema';
import {
	action, computed, observable, reaction, runInAction,
} from 'mobx';
import api from '../api';
import { SchemaType } from '../components/Control';
import { Dictionary } from '../models/Dictionary';
import {
	ActSendingResponse,
	MessageSendingResponse,
	ParsedMessage,
	ParsedMessageItem,
	ActMessageItem,
	isParsedMessageItem,
	isActMessageItem,
} from '../models/Message';
import Service, { Method } from '../models/Service';
import { setInLocalStorage, getFromLocalStorage } from '../helpers/localStorageManager';
import MessageListDataStore from './MessageListDataStore';

export default class Store {
	messageListDataStore = new MessageListDataStore(this);

	@observable dictionaries: Array<string> = [];

	@observable sessions: Array<string> = [];

	@observable dictionary: Dictionary = [];

	@observable selectedDictionaryName: string | null = null;

	@observable selectedMessageType: string | null = null;

	@observable selectedSession: string | null = null;

	@observable parsedMessage: ParsedMessage | null = null;

	@observable acts: Array<string> = [];

	@observable selectedActBox: string | null = null;

	@observable services: string[] = [];

	@observable selectedService: string | null = null;

	@observable serviceDetails: Service | null = null;

	@observable selectedMethod: Method | null = null;

	@observable actSchema: JSONSchema4 | null = null;

	@observable selectedSchemaType: SchemaType = 'parsed-message';

	@observable isSessionsLoading = false;

	@observable isDictionariesLoading = false;

	@observable isDictionaryLoading = false;

	@observable isActsLoading = false;

	@observable isServicesLoading = false;

	@observable isMethodsLoading = false;

	@observable isSending = false;

	@observable isSchemaLoading = false;

	@observable isSchemaApplied = false;

	@action setSelectedMethod = (methodName: string | null) => {
		if (this.selectedService) {
			this.getServiceDetails(this.selectedService).then(() => {
				this.selectedMethod = this.serviceDetails?.methods.find(method => method.methodName === methodName)
					|| null;
			});
		}
	};

	@action startApp = () => {
		const actMessageList = getFromLocalStorage('actMessagesHistory') || '';
		localStorage.removeItem('actMessagesHistory');
		this.messageListDataStore.actMessagesHistory = [];
		if (actMessageList !== '') {
			JSON.parse(actMessageList).forEach((element: ActMessageItem) => {
				this.messageListDataStore.addParsedMessage(element);
			});
		}

		const parsedMessageList = getFromLocalStorage('parsedMessagesHistory') || '';
		localStorage.removeItem('parsedMessagesHistory');
		this.messageListDataStore.parsedMessagesHistory = [];
		if (parsedMessageList !== '') {
			JSON.parse(parsedMessageList).forEach((element: ParsedMessageItem) => {
				this.messageListDataStore.addParsedMessage(element);
			});
		}
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

	constructor() {
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
				if (!this.messageListDataStore.editMessageMode) {
					setInLocalStorage('selectedActBox', selectedActBox || '');
				}
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
				if (!this.messageListDataStore.editMessageMode) {
					setInLocalStorage('selectedService', selectedService || '');
				}
			},
		);

		reaction(
			() => this.selectedMethod,
			async selectedMethod => {
				if (selectedMethod && this.selectedService && this.selectedActBox) {
					this.getActSchema(this.selectedService, selectedMethod.methodName);
				}
				if (!this.messageListDataStore.editMessageMode) {
					setInLocalStorage('selectedMethodName', selectedMethod?.methodName || '');
				}
			},
		);

		reaction(
			() => this.selectedSession,
			selectedSession => {
				if (!this.messageListDataStore.editMessageMode) {
					setInLocalStorage('selectedSessionId', selectedSession || '');
				}
			},
		);

		reaction(
			() => this.selectedDictionaryName,
			dictinonaryName => {
				if (dictinonaryName) {
					this.getDictionary(dictinonaryName);
				}
				if (!this.messageListDataStore.editMessageMode) {
					setInLocalStorage('selectedDictionaryName', dictinonaryName || '');
				}
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
				if (!this.messageListDataStore.editMessageMode) {
					setInLocalStorage('selectedMessageType', messageType || '');
				}
			},
		);
	}

	@action
	setIsSchemaApplied = (isApplied: boolean) => {
		this.isSchemaApplied = isApplied;
	};

	@action
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

	@action
	getDictionary = async (dictinonaryName: string) => {
		this.isDictionaryLoading = true;
		try {
			const dictionary = await api.getDictionary(dictinonaryName);
			this.dictionary = dictionary;
			if (this.selectedMessageType != null) {
				this.getMessageSchema(this.selectedMessageType, dictinonaryName);
			}
		} catch (error) {
			console.error('Error occured while fetching dictionary');
		}
		this.isDictionaryLoading = false;
	};

	@action
	getMessageSchema = async (messageType: string, dictinonaryName: string) => {
		this.isSchemaLoading = true;
		try {
			const message = await api.getMessage(messageType, dictinonaryName);
			if (message === null) {
				localStorage.removeItem('selectedMessageType');
				this.selectedMessageType = null;
				this.messageListDataStore.setEditorCode('{}');
			}
			this.parsedMessage = message;
		} catch (error) {
			console.error('Error occured while fetching message');
		}
		this.isSchemaLoading = false;
	};

	@action
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

	@action replayMessage = async (message: ParsedMessageItem | ActMessageItem, index: number) => {
		let result: MessageSendingResponse | ActSendingResponse | null = null;
		if (isParsedMessageItem(message)) {
			result = await api.sendMessage({
				session: message.sessionId,
				dictionary: message.dictionary,
				messageType: message.messageType,
				message: JSON.parse(message.message as string),
			});
			this.messageListDataStore.changeIndicator(
				index,
				result.code === 200 ? 'indicator-successful' : 'indicator-unsuccessful',
			);
		}
		if (isActMessageItem(message)) {
			result = await api.callMethod({
				fullServiceName: message.fullServiceName,
				methodName: message.methodName,
				message: JSON.parse(message.message as string),
			});
			this.messageListDataStore.changeIndicator(
				index,
				result.code === 200 ? 'indicator-successful' : 'indicator-unsuccessful',
			);
		}
	};

	@action
	sendMessage = async (message: object): Promise<MessageSendingResponse | null> => {
		this.isSending = true;

		let result: MessageSendingResponse | ActSendingResponse | null = null;

		switch (this.selectedSchemaType) {
			case 'parsed-message': {
				if (
					!this.selectedDictionaryName
					|| !this.selectedMessageType
					|| !this.selectedSession
				) {
					this.isSending = false;
					return null;
				}

				result = await api.sendMessage({
					session: this.selectedSession,
					dictionary: this.selectedDictionaryName,
					messageType: this.selectedMessageType,
					message,
				});

				this.messageListDataStore.addParsedMessage({
					sessionId: this.selectedSession,
					dictionary: this.selectedDictionaryName,
					messageType: this.selectedMessageType,
					message: JSON.stringify(message),
					delay: 0,
					indicator: 'indicator-unvisible',
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

				this.messageListDataStore.addParsedMessage({
					actBox: this.selectedActBox,
					fullServiceName: this.selectedService,
					methodName: this.selectedMethod.methodName,
					message: JSON.stringify(message),
					delay: 0,
					indicator: 'indicator-unvisible',
				});
				break;
			}
			default:
		}
		this.isSending = false;

		return result;
	};

	@action
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

	@action
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

	@action
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

	@action setSelectedSchemaType = (type: SchemaType) => {
		setInLocalStorage('selectedSchemaType', type);
		this.selectedSchemaType = type;
		this.messageListDataStore.prepareForSelectedSchemaType(type);
		this.setIsSchemaApplied(false);
	};

	@computed get selectedSchema() {
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

	@action
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

	@computed
	get isSendingAllowed(): boolean {
		switch (this.selectedSchemaType) {
			case 'parsed-message': {
				return !!(
					!this.isSending
					&& this.selectedSession
					&& this.selectedDictionaryName
					&& this.selectedMessageType
				);
			}
			case 'act': {
				return !!(
					!this.isSending
					&& this.selectedActBox
					&& this.selectedService
					&& this.selectedMethod
				);
			}
			default:
				return false;
		}
	}
}
