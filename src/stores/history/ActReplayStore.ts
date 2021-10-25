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
import { ActReplayItem } from '../../models/Message';
import api from '../../api';
import localStorageWorker from '../../helpers/localStorageWorker';
import { ActMessageOptions } from '../options/ActOptionsStore';
import RootStore from '../RootStore';
import { downloadFile } from '../../helpers/downloadFile';

type ActReplayExportData = Pick<
	ActReplayItem,
	'actBox' | 'fullServiceName' | 'methodName' | 'message' | 'name' | 'delay'
>;

export default class ActReplayStore extends ReplayStore<ActReplayItem, ActMessageOptions> {
	constructor(rootStore: RootStore) {
		super(rootStore);

		makeObservable(this, {
			replayMessage: action,
		});

		this.replayList = localStorageWorker.getActMessageHistory();
		this.setEditMessageMode(localStorageWorker.getEditActMessageMode());
		this.editedMessageId = localStorageWorker.getEditedActMessageId();

		reaction(
			() => this.replayList,
			actMessagesHistory => {
				localStorageWorker.setActMessageHistory(actMessagesHistory);
			},
		);

		reaction(
			() => this.editedMessageId,
			editedMessageId => localStorageWorker.setEditedActMessageId(editedMessageId),
		);

		reaction(
			() => this.editMessageMode,
			editMessageMode => localStorageWorker.setEditActMessageMode(editMessageMode),
		);
	}

	get options() {
		return this.rootStore.editorStore.options.act.selectedOptions;
	}

	buildEditedMessage = (id: string): ActReplayItem | null => {
		const options = this.options;
		const message = this.replayList.find(msg => msg.id === id);

		if (!options || !message) return null;

		return {
			id,
			...options,
			createdAt: message.createdAt,
			message: this.editedMessageCode,
			delay: message.delay,
			status: 'edited',
		};
	};

	replayMessage = flow(function* (this: ActReplayStore, id: string) {
		const msg = this.replayList.find(message => message.id === id);

		if (msg) {
			const { fullServiceName, methodName, message } = msg;

			try {
				const result = yield api.callMethod({
					fullServiceName,
					methodName,
					message: JSON.parse(message),
				});

				msg.status = result.code === 200 ? 'success' : 'fail';
			} catch (error) {
				// eslint-disable-next-line no-alert
				alert('Error while sending');
				msg.status = 'fail';
			}

			this.replayList = [...this.replayList];
		}
	});

	exportReplayList = () => {
		const replayListToExport = this.replayList.map(
			({ actBox, fullServiceName, methodName, message, name, delay }) => ({
				actBox,
				fullServiceName,
				methodName,
				message,
				name,
				delay,
			}),
		);

		downloadFile(JSON.stringify(replayListToExport, null, '    '), 'actReplay', 'application/json');
	};

	importFromJSON = (jsonString: string) => {
		try {
			const jsonData = JSON.parse(jsonString);

			jsonData.forEach(({ actBox, fullServiceName, methodName, message, name, delay }: ActReplayExportData) => {
				this.addMessage({
					actBox,
					fullServiceName,
					methodName,
					message,
					name,
					delay,
					id: nanoid(),
					createdAt: +new Date(),
					status: 'ready',
				});
			});
		} catch (e) {
			console.error('Failed to import messages');
		}
	};
}
