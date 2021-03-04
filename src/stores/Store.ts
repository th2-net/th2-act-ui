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
	action,
	computed,
	observable,
	reaction,
	runInAction,
} from 'mobx';
import api from '../api';
import { SchemaType } from '../components/Control';
import { Dictionary } from '../models/Dictionary';
import { ParsedMessage } from '../models/Message';
import Service, { Method } from '../models/Service';

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
		try {
			const dictionary = await api.getDictionary(dictinonaryName);
			this.dictionary = dictionary;
		} catch (error) {
			console.error('Error occured while fetching dictionary');
		}
	};

	@action
	getMessageSchema = async (messageType: string, dictinonaryName: string) => {
		try {
			const message = await api.getMessage(messageType, dictinonaryName);
			this.parsedMessage = message;
		} catch (error) {
			console.error('Error occured while fetching message');
		}
	};

	@action
	getSessions = async () => {
		try {
			const sessions = await api.getSessions();
			this.sessions = sessions;
			if (sessions.length === 1) {
				this.selectedSession = sessions[0];
			}
		} catch (error) {
			console.error('Error occured while fetching dictionaries');
		}
	};

	sendMessage = async (message: object) => {
		switch (this.selectedSchemaType) {
			case 'parsed-message': {
				if (!this.selectedDictionaryName || !this.selectedMessageType || !this.selectedSession) return;
				await api.sendMessage({
					session: this.selectedSession,
					dictionary: this.selectedDictionaryName,
					messageType: this.selectedMessageType,
					message,
				});
				break;
			}
			case 'act': {
				if (!this.selectedActBox || !this.selectedService || !this.selectedMethod) return;
				await api.callMethod({
					fullServiceName: this.selectedService,
					methodName: this.selectedMethod.methodName,
					message,
				});
				break;
			}
			default:
		}
	};

	@action
	getActs = async () => {
		try {
			const actsList = await api.getActsList();
			this.acts = actsList;
			if (actsList.length === 1) {
				this.selectedActBox = actsList[0];
			}
		} catch (error) {
			console.error('Error occured while fetching dictionaries');
		}
	};

	@action
	getServices = async (actBox: string) => {
		try {
			const services = await api.getServices(actBox);
			this.services = services;
			if (services.length === 1) {
				this.selectedService = services[0];
			}
		} catch (error) {
			console.error('Error occured while fetching dictionaries');
		}
	};

	@action
	getServiceDetails = async (serviceName: string) => {
		try {
			const serviceDetails = await api.getServiceDetails(serviceName);
			if (!serviceDetails) return;

			this.serviceDetails = serviceDetails;
			if (serviceDetails.methods.length === 1) {
				this.selectedMethod = serviceDetails.methods[0];
			}
		} catch (error) {
			console.error('Error occured while fetching dictionaries');
		}
	};

	@action setSelectedSchemaType = (type: SchemaType) => {
		this.selectedSchemaType = type;
	};

	@computed get selectedSchema() {
		switch (this.selectedSchemaType) {
			case 'parsed-message': return this.parsedMessage
				? this.parsedMessage[Object.keys(this.parsedMessage)[0]] as JSONSchema7
				: null;
			case 'act': return this.actSchema;
			default: throw new Error('');
		}
	}

	@action
	getActSchema = async (serviceName: string, methodName: string) => {
		if (!this.selectedMethod) return;
		try {
			const actMessage = await api.getActSchema(serviceName, methodName);
			if (!actMessage) return;

			this.actSchema = JSON.parse(actMessage[this.selectedMethod.inputType]) as JSONSchema4;
		} catch (error) {
			console.error('Error occured while fetching dictionaries');
		}
	};
}
