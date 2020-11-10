/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
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

import { action, observable, reaction } from 'mobx';
import api from '../api';
import { Dictionary } from '../models/Dictionary';
import { Message } from '../models/Message';

export default class Store {
	@observable dictionaries: Array<string> = [];

	@observable dictionary: Dictionary = [];

	@observable selectedDictionaryName: string | null = null;

	@observable selectedMessageType: string | null = null;

	@observable message: Message | null = null;

	constructor() {
		this.getDictionaries();

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
			this.message = message;
		} catch (error) {
			console.error('Error occured while fetching message');
		}
	};
}
