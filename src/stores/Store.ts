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
	ActSendingResponse, MessageSendingResponse, ParsedMessage,
} from '../models/Message';
import Service, { Method } from '../models/Service';

export default class Store {
	@observable dictionaries: Array<string> = [];

	@observable sentMessages: Array<string> = [];

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

	@observable parsedMessagesHistory: string[] = [];

	@observable fromFileMessage = false;

	@observable indicators: string[] = [];

	@observable editorCode = '{}';

	@observable sendButtonTitle = 'Send Message';

	@observable sendButtonIcon = 'arrow-right-icon';

	@observable editMessageMode = false;

	@observable editedMessageIndex = -1;

	@observable editedMessageSendDelay = 0;

	@action setEditedMessageSendDelay = (delay: number) => {
		this.editedMessageSendDelay = delay;
	};

	@observable setEditedMessageIndex = (index: number) => {
		this.editedMessageIndex = index;
		if (localStorage.getItem('editedMessageIndex') !== index.toString()) {
			localStorage.setItem('editedMessageIndex', index.toString());
		}
	};

	@action saveEditedMessage = () => {
		if (this.editedMessageIndex >= 0) {
			const editedMessage: string = JSON.stringify({
				session: this.selectedSession,
				dictionary: this.selectedDictionaryName,
				messageType: this.selectedMessageType,
				message: JSON.parse(this.parsedMessagesHistory[this.editedMessageIndex]).message,
				delay: this.editedMessageSendDelay,
			});
			this.parsedMessagesHistory[this.editedMessageIndex] = editedMessage;
			this.indicators[this.editedMessageIndex] = 'circleEdited';
			this.setEditedMessageIndex(-1);
			this.setEditMessageMode(false);
		}
	};

	@action setEditMessageMode=(mode: boolean) => {
		this.editMessageMode = mode;
		if (mode === false) {
			this.setSelectedSession(null);
			this.setSelectedMessageType(null);
			this.setDictionaryName(null);
			this.setEditedMessageIndex(-1);
			this.setSendButtonIcon('arrow-right-icon');
			this.setSendButtonTitle('Send Message');
		}

		if (!localStorage.getItem('editMessageMode') || localStorage.getItem('editMessageMode') !== mode.toString()) {
			localStorage.setItem('editMessageMode', mode.toString());
		}
	};

	@action selectMessage = (index: number) => {
		this.setSelectedSession(JSON.parse(this.parsedMessagesHistory[index]).session);
		this.setDictionaryName(JSON.parse(this.parsedMessagesHistory[index]).dictionary);
		this.setSelectedMessageType(JSON.parse(this.parsedMessagesHistory[index]).messageType);
		this.setEditorCode('{}');
		this.setSendButtonTitle('Save');
		this.setSendButtonIcon('');
		this.setEditMessageMode(true);
		this.setEditedMessageIndex(index);
	};

	@action setSendButtonIcon =(iconClass: string) => {
		this.sendButtonIcon = iconClass;
	};

	@action setSendButtonTitle = (title: string) => {
		this.sendButtonTitle = title;
	};

	@action setSelectedSession = (session: string | null) => {
		this.selectedSession = session;
		if (this.editMessageMode === false && session !== null) {
			localStorage.setItem('selectedSession', session);
		}
	};

	@action setSelectedMessageType = (messageType: string | null) => {
		this.selectedMessageType = messageType;
		if (this.editMessageMode === false && messageType !== null) {
			localStorage.setItem('selectedMessageType', messageType);
		}
	};

	@action setDictionaryName = (dictionary: string | null) => {
		this.selectedDictionaryName = dictionary;
		if (this.editMessageMode === false && dictionary !== null) {
			localStorage.setItem('selectedDictionary', dictionary);
		}
	};

	@action setEditorCode = (code: string) => {
		this.editorCode = code;
	};

	@action getIndicatorByResult = (code: number): string => {
		if (code === 200) return 'circleGreen';
		return 'circleRed';
	};

    @action addIndicator = (indicatorClass: string) => {
    	this.indicators.push(indicatorClass);
    };

    @action changeIndicator = (index: number, indicatorClass: string) => {
    	this.indicators[index] = indicatorClass;
    };

	@action deleteIndicator = (index: number): string[] => {
		const tmpArray: string[] = this.indicators.slice();
		this.indicators = [];
		tmpArray.forEach((item, i) => {
			if (i !== index) {
				this.addIndicator(item);
			}
		});
		return this.indicators;
	};

	@action setFromFile = (flag: boolean) => {
		this.fromFileMessage = flag;
	};

	@action addParsedMessage = (message: string, indicatorClass?: string) => {
		this.addIndicator(indicatorClass || 'circleUnvisible');
		this.parsedMessagesHistory.push(message);
		localStorage.setItem('messageList', this.parsedMessagesHistory.toString());
	};

	@action clearParsedMessages = () => {
		this.parsedMessagesHistory = [];
		this.indicators = [];
		localStorage.setItem('messageList', this.parsedMessagesHistory.toString());
		if (this.editMessageMode === true) {
			this.setEditMessageMode(false);
		}
	};

	@action startApp = () => {
		this.setSelectedSchemaType(localStorage.getItem('selectedSchemaType')
			? localStorage.getItem('selectedSchemaType') as SchemaType : this.selectedSchemaType);
		if (localStorage.getItem('session') === '0') {
			const str = localStorage.getItem('messageList') ? localStorage.getItem('messageList') : '';
			localStorage.removeItem('messageList');
			this.parsedMessagesHistory = [];
			const json = JSON.parse(`[${str as string}]`);
			for (let i = 0; i < json.length; i++) {
				this.addParsedMessage(JSON.stringify(json[i]));
			}
			localStorage.setItem('session', '1');
		}
		this.setEditMessageMode(localStorage.getItem('editMessageMode') === 'true');
		this.editedMessageIndex = localStorage.getItem('editedMessageIndex')
			? localStorage.getItem('editedMessageIndex') as unknown as number : -1;
		if (this.editMessageMode === true) {
			this.setSelectedSession(JSON.parse(this.parsedMessagesHistory[this.editedMessageIndex]).session);
			this.setDictionaryName(JSON.parse(this.parsedMessagesHistory[this.editedMessageIndex]).dictionary);
			this.setSelectedMessageType(JSON.parse(this.parsedMessagesHistory[this.editedMessageIndex]).messageType);
			this.setEditorCode('{}');
			this.setSendButtonTitle('Save');
			this.setSendButtonIcon('');
		} else {
			this.setSelectedSession(localStorage.getItem('selectedSession'));
			this.setDictionaryName(localStorage.getItem('selectedDictionary'));
			this.setSelectedMessageType(localStorage.getItem('selectedMessageType'));
		}
	};

	constructor() {
		this.getDictionaries();
		this.getSessions();
		this.getActs();

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
			},
		);

		reaction(
			() => this.selectedService,
			selectedService => {
				if (selectedService && this.selectedActBox) {
					this.getServiceDetails(selectedService);
				} else {
					this.serviceDetails = null;
					this.selectedMethod = null;
				}
			},
		);

		reaction(
			() => this.selectedMethod,
			async selectedMethod => {
				if (selectedMethod && this.selectedService && this.selectedActBox) {
					this.getActSchema(this.selectedService, selectedMethod.methodName);
				}
			},
		);

		reaction(
			() => this.selectedDictionaryName,
			dictinonaryName => {
				if (dictinonaryName) {
					this.getDictionary(dictinonaryName);
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

	@action
	sendMessage = async (message: object): Promise<MessageSendingResponse | null> => {
		this.isSending = true;

		let result: MessageSendingResponse | ActSendingResponse | null = null;

		switch (this.selectedSchemaType) {
			case 'parsed-message': {
				if (this.fromFileMessage) {
					result = await api.sendMessage({
						session: JSON.parse(message as unknown as string).session,
						dictionary: JSON.parse(message as unknown as string).dictionary,
						messageType: JSON.parse(message as unknown as string).messageType,
						message: JSON.parse(message as unknown as string).message,
					});
					this.addParsedMessage(message as unknown as string, this.getIndicatorByResult(result.code));
				} else {
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

					this.addParsedMessage(JSON.stringify({
						session: this.selectedSession,
						dictionary: this.selectedDictionaryName,
						messageType: this.selectedMessageType,
						message,
					}));
				}
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
		this.selectedSchemaType = type;
		localStorage.setItem('selectedSchemaType', type);
		this.setIsSchemaApplied(false);
	};

	@computed get selectedSchema() {
		switch (this.selectedSchemaType) {
			case 'parsed-message':
				return this.parsedMessage
					? this.parsedMessage[Object.keys(this.parsedMessage)[0]] as JSONSchema7
					: null;
			case 'act':
				return this.actSchema;
			case 'from-list':
				return this.parsedMessage
					? this.parsedMessage[Object.keys(this.parsedMessage)[0]] as JSONSchema7
					: null;
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
			if (!actMessage) return;

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
				return !!(!this.isSending && this.selectedActBox && this.selectedService && this.selectedMethod);
			}
			default: return false;
		}
	}
}
