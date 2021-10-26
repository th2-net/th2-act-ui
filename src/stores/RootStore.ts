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
import EditorStore from './EditorStore';
import ActMessagesStore from './messages/ActMessagesStore';
import ParsedMessagesStore from './messages/ParsedMessagesStore';
import { SchemaType } from '../components/Control';
import localStorageWorker from '../helpers/localStorageWorker';

type MessagesStores = {
	act: ActMessagesStore;
	parsedMessage: ParsedMessagesStore;
};

export default class RootStore {
	editorStore = new EditorStore(this);

	messagesStores: MessagesStores = {
		act: new ActMessagesStore(this),
		parsedMessage: new ParsedMessagesStore(this),
	};

	schemaType: SchemaType = localStorageWorker.getSelectedSchemaType();

	constructor() {
		makeObservable(this, {
			schemaType: observable,
			setSchemaType: action,
		});

		reaction(
			() => this.schemaType,
			schemaType => localStorageWorker.setSelectedSchemaType(schemaType),
		);
	}

	setSchemaType = (schemaType: SchemaType) => {
		this.schemaType = schemaType;
	};

	get currentMessagesStore() {
		return this.messagesStores[this.schemaType];
	}

	init = flow(function* (this: RootStore) {
		yield Promise.all([this.editorStore.options.act.init(), this.editorStore.options.parsedMessage.init()]);
	});
}
