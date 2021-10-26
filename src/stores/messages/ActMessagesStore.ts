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

import { flow, makeObservable } from 'mobx';
import { nanoid } from 'nanoid';
import ActReplayStore from '../history/ActReplayStore';
import api from '../../api';
import MessagesStore from './MessagesStore';
import { ActMessageOptions } from '../options/ActOptionsStore';
import RootStore from '../RootStore';

export default class ActMessagesStore extends MessagesStore<ActMessageOptions> {
	historyStore = new ActReplayStore(this.rootStore);

	constructor(rootStore: RootStore) {
		super(rootStore);

		makeObservable(this, {
			sendMessage: flow,
		});
	}

	sendMessage = flow(function* (this: ActMessagesStore, message: object) {
		const options = this.rootStore.editorStore.options.act.selectedOptions;
		if (!options) return;

		this.isSending = true;

		try {
			this.messageSendingResponse = yield api.callMethod({
				...options,
				message,
			});

			this.historyStore.addMessage({
				id: nanoid(),
				...options,
				createdAt: +new Date(),
				message: JSON.stringify(message, null, 4),
				delay: 0,
				status: {
					type: 'ready',
					response: null,
				},
			});
		} catch (error) {
			console.error('Error occurred while calling method');
		} finally {
			this.isSending = false;
		}
	});
}
