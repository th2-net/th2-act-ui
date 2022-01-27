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

import { action, computed, flow, makeObservable, observable } from 'mobx';
import { DictionaryEntity, isDictionaryEntity } from '../models/Dictionary';
import api from '../api';
import { Schema } from '../models/Schema';
import RootStore from './RootStore';

export default class DictionaryStore {
	isLoadingDictionary = false;

	isSavingDictionary = false;

	dictionary: DictionaryEntity | null = null;

	constructor(private readonly rootStore: RootStore) {
		makeObservable(this, {
			isLoadingDictionary: observable,
			isSavingDictionary: observable,
			dictionary: observable,
			isDictionaryCodeValid: computed,
			setDictionaryCode: action,
		});
	}

	get isDictionaryCodeValid() {
		if (!this.dictionary) return null;
		const parser = new DOMParser();
		const doc = parser.parseFromString(this.dictionary.spec.data, 'application/xml');
		return doc.getElementsByTagName('parsererror').length === 0;
	}

	fetchDictionary = flow(function* (this: DictionaryStore, schemaName: string, dictionaryName: string) {
		this.isLoadingDictionary = true;
		try {
			const schema: Schema | null = yield api.fetchSchema(schemaName);
			this.dictionary =
				schema?.resources.filter(isDictionaryEntity).find(({ name }) => name === dictionaryName) ?? null;
		} catch (error) {
			console.error('Error occurred while fetching dictionary');
		} finally {
			this.isLoadingDictionary = false;
		}
	});

	setDictionaryCode = (dictionaryCode: string) => {
		if (this.dictionary) {
			this.dictionary.spec.data = dictionaryCode;
		}
	};

	saveDictionary = flow(function* (this: DictionaryStore, schemaName: string) {
		const parsedMessage = this.rootStore.editorStore.options.parsedMessage;
		if (!this.dictionary || !parsedMessage.selectedDictionary) return;

		this.isSavingDictionary = true;
		try {
			yield api.updateDictionary(schemaName, { operation: 'update', payload: this.dictionary });

			parsedMessage.fetchMessageTypes(parsedMessage.selectedDictionary);
			if (parsedMessage.selectedMessageType) {
				parsedMessage.fetchSchema(parsedMessage.selectedMessageType, parsedMessage.selectedDictionary);
			}
		} catch (error) {
			console.error('Error occurred while saving dictionary');
		} finally {
			this.isSavingDictionary = false;
		}
	});
}
