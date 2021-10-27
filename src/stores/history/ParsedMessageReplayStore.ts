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

import { action, flow, makeObservable, reaction } from 'mobx';
import { nanoid } from 'nanoid';
import ReplayStore from './ReplayStore';
import { ParsedMessageReplayItem } from '../../models/Message';
import api from '../../api';
import localStorageWorker from '../../helpers/localStorageWorker';
import { ParsedMessageOptions } from '../options/ParsedMessageOptionsStore';
import RootStore from '../RootStore';
import { downloadFile } from '../../helpers/downloadFile';

type ParsedMessageReplayExportData = Pick<
	ParsedMessageReplayItem,
	'session' | 'dictionary' | 'messageType' | 'message' | 'name' | 'delay'
>;

const isParsedMessageReplayExportData = (object: any): object is ParsedMessageReplayExportData =>
	typeof object.session === 'string' &&
	typeof object.dictionary === 'string' &&
	typeof object.messageType === 'string' &&
	typeof object.message === 'string' &&
	typeof object.delay === 'number';

export default class ParsedMessageReplayStore extends ReplayStore<ParsedMessageReplayItem, ParsedMessageOptions> {
	constructor(rootStore: RootStore) {
		super(rootStore);

		makeObservable(this, {
			replayMessage: action,
			importFromJSON: action,
		});

		this.replayList = localStorageWorker.getParsedMessageHistory();

		reaction(
			() => this.replayList,
			parsedMessageHistory => {
				localStorageWorker.setParsedMessageHistory(parsedMessageHistory);
			},
		);
	}

	get options() {
		return this.rootStore.editorStore.options.parsedMessage.selectedOptions;
	}

	buildEditedMessage = (id: string): ParsedMessageReplayItem | null => {
		const options = this.options;
		const message = this.replayList.find(msg => msg.id === id);

		if (!options || !message) return null;

		return {
			id,
			...options,
			name: message.name,
			createdAt: message.createdAt,
			message: this.editedMessageCode,
			delay: message.delay,
			status: {
				type: 'edited',
				response: null,
			},
		};
	};

	replayMessage = flow(function* (this: ParsedMessageReplayStore, id: string) {
		const msg = this.replayList.find(message => message.id === id);

		if (msg) {
			const { session, dictionary, messageType, message } = msg;
			try {
				const result = yield api.sendMessage({
					session,
					dictionary,
					messageType,
					message: JSON.parse(message),
				});

				msg.status.type = result.code === 200 ? 'success' : 'fail';
				msg.status.response = result;
			} catch (error) {
				// eslint-disable-next-line no-alert
				alert('Error while sending');
				msg.status.type = 'fail';
			}

			this.replayList = [...this.replayList];
		}
	});

	exportReplayList = () => {
		const replayListToExport = this.replayList.map(
			({ session, dictionary, messageType, message, name, delay }) => ({
				session,
				dictionary,
				messageType,
				message,
				name,
				delay,
			}),
		);

		downloadFile(JSON.stringify(replayListToExport, null, '    '), 'parsedMessagesReplay', 'application/json');
	};

	importFromJSON = (jsonString: string) => {
		try {
			const jsonData = JSON.parse(jsonString);

			if (!Array.isArray(jsonData) || jsonData.every(object => !isParsedMessageReplayExportData(object))) {
				throw new Error('Incorrect json data');
			}

			jsonData.forEach(
				({ session, dictionary, messageType, message, name, delay }: ParsedMessageReplayExportData) => {
					this.addMessage({
						session,
						dictionary,
						messageType,
						message,
						name,
						delay,
						id: nanoid(),
						createdAt: +new Date(),
						status: {
							type: 'ready',
							response: null,
						},
					});
				},
			);
		} catch (e) {
			console.error('Failed to import messages');
		}
	};
}
