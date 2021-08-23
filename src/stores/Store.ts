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
import { ActSendingResponse, MessageSendingResponse, ParsedMessage } from '../models/Message';
import Service, { Method } from '../models/Service';
import {
	ParsedMessageItem,
	ActMessageItem,
	Indicator,
	isActMessageItem,
	isParsedMessageItem,
} from '../components/MessageList';

export default class Store {
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

	@observable parsedMessagesHistory: ParsedMessageItem[] = [];

	@observable actMessagesHistory: ActMessageItem[] = [];

	@observable isReplay = false;

	@observable indicators: Indicator[] = [];

	@observable editorCode = '{}';

	@observable editMessageMode = false;

	@observable editedMessageIndex = -1;

	@observable editedMessageSendDelay = 0;

	@observable messageListPanelArea = 50;

	@action setSelectedMethod = (methodName: string | null) => {
		if (this.selectedService) {
			this.getServiceDetails(this.selectedService).then(() => {
				this.selectedMethod = this.serviceDetails?.methods.find(method => method.methodName === methodName)
					|| null;
			});
		}
	};

	@action setEditedMessageSendDelay = (delay: number) => {
		this.editedMessageSendDelay = delay;
	};

	@observable setEditedMessageIndex = (index: number) => {
		this.editedMessageIndex = index;
		if (this.selectedSchemaType === 'parsed-message') {
			localStorage.setItem('editedParsedMessageIndex', index.toString());
		} else if (this.selectedSchemaType === 'act') {
			localStorage.setItem('editedActMessageIndex', index.toString());
		}
	};

	buildEditedMessage = (): ParsedMessageItem | ActMessageItem | undefined => {
		if (this.selectedSchemaType === 'parsed-message') {
			if (this.selectedSession && this.selectedDictionaryName && this.selectedMessageType) {
				const editedMessage: ParsedMessageItem = {
					sessionId: this.selectedSession,
					dictionary: this.selectedDictionaryName,
					messageType: this.selectedMessageType,
					message: this.editorCode,
					delay: this.editedMessageSendDelay,
				};
				return editedMessage;
			}
			return undefined;
		}
		if (this.selectedSchemaType === 'act') {
			if (this.selectedActBox && this.selectedService && this.selectedMethod) {
				const editedMessage: ActMessageItem = {
					actBox: this.selectedActBox,
					fullServiceName: this.selectedService,
					methodName: this.selectedMethod?.methodName,
					message: this.editorCode,
					delay: this.editedMessageSendDelay,
				};
				return editedMessage;
			}
			return undefined;
		}
		return undefined;
	};

	@action saveEditedMessage = () => {
		if (this.editedMessageIndex >= 0) {
			const message: ParsedMessageItem | ActMessageItem | undefined =				this.buildEditedMessage();
			if (message !== undefined) {
				if (this.selectedSchemaType === 'parsed-message' && isParsedMessageItem(message)) {
					this.parsedMessagesHistory[this.editedMessageIndex] = message;
				} else if (this.selectedSchemaType === 'act' && isActMessageItem(message)) {
					this.actMessagesHistory[this.editedMessageIndex] = message;
				}
				this.indicators[this.editedMessageIndex] = 'indicator-edited';
			}

			this.setEditMessageMode(false);
		}
	};

	@action setEditMessageMode = (mode: boolean) => {
		this.editMessageMode = mode;
		if (mode === false) {
			this.setEditedMessageIndex(-1);
		}
		if (this.selectedSchemaType === 'parsed-message') {
			localStorage.setItem('editParsedMessageMode', mode.toString());
		} else if (this.selectedSchemaType === 'act') {
			localStorage.setItem('editActMessageMode', mode.toString());
		}
	};

	@action selectMessage = (index: number) => {
		if (this.selectedSchemaType === 'parsed-message') {
			this.setEditorProperties(
				this.parsedMessagesHistory[index].sessionId,
				this.parsedMessagesHistory[index].dictionary,
				this.parsedMessagesHistory[index].messageType,
				this.parsedMessagesHistory[index].message as string,
			);
		} else if (this.selectedSchemaType === 'act') {
			this.setEditorProperties(
				this.actMessagesHistory[index].actBox,
				this.actMessagesHistory[index].fullServiceName,
				this.actMessagesHistory[index].methodName,
				this.actMessagesHistory[index].message as string,
			);
		}

		this.setEditMessageMode(true);
		this.setEditedMessageIndex(index);
	};

	setEditorProperties = (
		sessionOrActBox: string | null,
		dictionaryOrService: string | null,
		messageTypeOrMethod: string | null,
		editorCode: string,
	) => {
		if (this.selectedSchemaType === 'parsed-message') {
			this.selectedSession = sessionOrActBox;
			this.selectedDictionaryName = dictionaryOrService;
			this.selectedMessageType = messageTypeOrMethod;
		} else if (this.selectedSchemaType === 'act') {
			this.selectedActBox = sessionOrActBox;
			this.selectedService = dictionaryOrService;
			this.setSelectedMethod(messageTypeOrMethod);
		}

		if (editorCode) {
			this.setEditorCode(editorCode);
		}
	};

	@action setEditorCode = (code: string) => {
		this.editorCode = code;
	};

	@action getIndicatorByResult = (code: number): Indicator => {
		if (code === 200) return 'indicator-successful';
		return 'indicator-unsuccessful';
	};

	@action addIndicator = (indicatorClass: Indicator) => {
		this.indicators.push(indicatorClass);
	};

	@action changeIndicator = (index: number, indicatorClass: Indicator) => {
		this.indicators[index] = indicatorClass;
	};

	@action deleteIndicator = (index: number): Indicator[] => {
		const tmpArray: Indicator[] = this.indicators.slice();
		this.indicators = [];
		tmpArray.forEach((item, i) => {
			if (i !== index) {
				this.addIndicator(item);
			}
		});
		return this.indicators;
	};

	@computed get getCurrentMessagesArray() {
		return this.selectedSchemaType === 'parsed-message'
			? this.parsedMessagesHistory
			: this.actMessagesHistory;
	}

	@action
	public setPanelArea = (panelArea: number) => {
		this.messageListPanelArea = panelArea;
	};

	@action setReplayMode = (flag: boolean) => {
		this.isReplay = flag;
	};

	@action addParsedMessage = (
		message: ParsedMessageItem | ActMessageItem,
		indicatorClass?: Indicator,
	) => {
		this.addIndicator(indicatorClass || 'indicator-unvisible');
		if (this.selectedSchemaType === 'parsed-message' && isParsedMessageItem(message)) {
			this.parsedMessagesHistory.push(message);
		} else if (this.selectedSchemaType === 'act' && isActMessageItem(message)) {
			this.actMessagesHistory.push(message);
		}
	};

	@action clearParsedMessages = () => {
		if (this.selectedSchemaType === 'parsed-message') {
			this.parsedMessagesHistory = [];
		} else if (this.selectedSchemaType === 'act') {
			this.actMessagesHistory = [];
		}
		this.indicators = [];

		if (this.editMessageMode === true) {
			this.setEditMessageMode(false);
		}
	};

	@action startApp = () => {
		const actMessageList = localStorage.getItem('actMessagesHistory')
			? localStorage.getItem('actMessagesHistory')
			: '';
		localStorage.removeItem('actMessagesHistory');
		this.actMessagesHistory = [];
		if (actMessageList !== '') {
			this.actMessagesHistory = JSON.parse(actMessageList as string);
		}

		const parsedMessageList = localStorage.getItem('parsedMessagesHistory')
			? localStorage.getItem('parsedMessagesHistory')
			: '';
		localStorage.removeItem('parsedMessagesHistory');
		this.parsedMessagesHistory = [];
		if (parsedMessageList !== '') {
			this.parsedMessagesHistory = JSON.parse(parsedMessageList as string);
		}
		this.selectedSession = localStorage.getItem('selectedSessionId');
		this.selectedDictionaryName = localStorage.getItem('selectedDictionary');
		this.selectedMessageType = localStorage.getItem('selectedMessageType');
		this.selectedActBox = localStorage.getItem('selectedActBox');
		this.selectedService = localStorage.getItem('selectedService');
		this.setSelectedMethod(localStorage.getItem('selectedMethodName'));

		this.setSelectedSchemaType(
			localStorage.getItem('selectedSchemaType')
				? (localStorage.getItem('selectedSchemaType') as SchemaType)
				: this.selectedSchemaType,
		);
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
				if (!this.editMessageMode) {
					localStorage.setItem('selectedActBox', selectedActBox || '');
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
				if (!this.editMessageMode) {
					localStorage.setItem('selectedService', selectedService || '');
				}
			},
		);

		reaction(
			() => this.selectedMethod,
			async selectedMethod => {
				if (selectedMethod && this.selectedService && this.selectedActBox) {
					this.getActSchema(this.selectedService, selectedMethod.methodName);
				}
				if (!this.editMessageMode) {
					localStorage.setItem('selectedMethodName', selectedMethod?.methodName || '');
				}
			},
		);

		reaction(
			() => this.selectedSession,
			selectedSession => {
				if (!this.editMessageMode) {
					localStorage.setItem('selectedSessionId', selectedSession || '');
				}
			},
		);

		reaction(
			() => this.selectedDictionaryName,
			dictinonaryName => {
				if (dictinonaryName) {
					this.getDictionary(dictinonaryName);
				}
				if (!this.editMessageMode) {
					localStorage.setItem('selectedDictionaryName', dictinonaryName || '');
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
				if (!this.editMessageMode) {
					localStorage.setItem('selectedMessageType', messageType || '');
				}
			},
		);

		reaction(
			() => this.parsedMessagesHistory.slice(),
			parsedMessageHistory => {
				localStorage.setItem('parsedMessagesHistory', JSON.stringify(parsedMessageHistory));
			},
		);

		reaction(
			() => this.actMessagesHistory.slice(),
			actMessagesHistory => {
				localStorage.setItem('actMessagesHistory', JSON.stringify(actMessagesHistory));
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
				this.setEditorCode('{}');
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

	@action
	replayMessage = async (message: ParsedMessageItem | ActMessageItem, index: number) => {
		let result: MessageSendingResponse | ActSendingResponse | null = null;
		switch (this.selectedSchemaType) {
			case 'parsed-message': {
				if (isParsedMessageItem(message)) {
					result = await api.sendMessage({
						session: message.sessionId,
						dictionary: message.dictionary,
						messageType: message.messageType,
						message: JSON.parse(message.message as string),
					});
					if (index != null) {
						this.changeIndicator(index, this.getIndicatorByResult(result.code));
					}
					// eslint-disable-next-line no-console
					console.log(this.indicators.toString());
				}
				break;
			}
			case 'act': {
				if (isActMessageItem(message)) {
					result = await api.callMethod({
						fullServiceName: message.fullServiceName,
						methodName: message.methodName,
						message: JSON.parse(message.message as string),
					});
					if (index != null) {
						this.changeIndicator(index, this.getIndicatorByResult(result.code));
					}
					// eslint-disable-next-line no-console
					console.log(this.indicators.toString());
				}
				break;
			}
			default:
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

				this.addParsedMessage({
					sessionId: this.selectedSession,
					dictionary: this.selectedDictionaryName,
					messageType: this.selectedMessageType,
					message: JSON.stringify(message),
					delay: 0,
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

				this.addParsedMessage({
					actBox: this.selectedActBox,
					fullServiceName: this.selectedService,
					methodName: this.selectedMethod.methodName,
					message: JSON.stringify(message),
					delay: 0,
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
		localStorage.setItem('selectedSchemaType', type);
		this.indicators = [];
		this.selectedSchemaType = type;
		this.prepareForSelectedSchemaType(type);
		this.setIsSchemaApplied(false);
	};

	prepareForSelectedSchemaType = (type: SchemaType) => {
		switch (type) {
			case 'parsed-message':
				this.parsedMessagesHistory.forEach(() => this.addIndicator('indicator-unvisible'));

				this.setEditMessageMode(localStorage.getItem('editParsedMessageMode') === 'true');

				this.editedMessageIndex = localStorage.getItem('editedParsedMessageIndex')
					? (localStorage.getItem('editedParsedMessageIndex') as unknown as number)
					: -1;
				break;
			case 'act':
				this.actMessagesHistory.forEach(() => this.addIndicator('indicator-unvisible'));

				this.setEditMessageMode(localStorage.getItem('editActMessageMode') === 'true');

				this.editedMessageIndex = localStorage.getItem('editedActMessageIndex')
					? (localStorage.getItem('editedActMessageIndex') as unknown as number)
					: -1;

				break;
			default:
				throw new Error('');
		}
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
