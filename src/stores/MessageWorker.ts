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

import { observable, reaction } from 'mobx';
import { EventMessage } from '../models/Message';

export enum IncomingMessageActions {
	ReplayMessage = 'replayMessage',
}

type IncomingMessageParamByAction<T extends IncomingMessageActions> = {
	replayMessage: EventMessage;
}[T];

type IncomingMessagesHandlers<T extends IncomingMessageActions> = {
	[K in IncomingMessageActions]: (message: IncomingMessageParamByAction<K>) => void;
}[T];

enum OutgoingMessageActions {
	plug = 'plug',
}

type OutgoingMessageParamByAction<T extends OutgoingMessageActions> = {
	plug: number;
}[T];

type CrossOriginMessage<T extends IncomingMessageActions | OutgoingMessageActions> = {
	action: T;
	payload: T extends IncomingMessageActions
		? IncomingMessageParamByAction<T>
		: T extends OutgoingMessageActions
		? OutgoingMessageParamByAction<T>
		: unknown;
	publisher: Apps;
};

enum Apps {
	ReportViewer = 'report-viewer',
	InfraEditor = 'infra-editor',
	ActUI = 'act-ui',
}

export default class MessageWorker {
	constructor() {
		reaction(() => this.subscribers.size, size =>
			(size
				? window.addEventListener
				: window.removeEventListener
			)('message', this.handleIncomingMessage));
	}

	@observable
	private subscribers: Map<IncomingMessageActions, Function[]> = new Map();

	private handleIncomingMessage = (message: MessageEvent<CrossOriginMessage<IncomingMessageActions>>) => {
		const { action, payload } = message.data;

		(this.subscribers.get(action) ?? []).forEach(callback => callback(payload));
	};

	public subscribeOnMessage = (action: IncomingMessageActions, callback: IncomingMessagesHandlers<typeof action>) => {
		const subGroup = this.subscribers.get(action);

		if (!subGroup) {
			this.subscribers.set(action, [callback]);
		} else {
			subGroup.push(callback);
		}
	};

	public unsubscribeFromMessage = (
		action: IncomingMessageActions,
		callback: IncomingMessagesHandlers<typeof action>,
	) => {
		const subGroup = this.subscribers.get(action);

		if (!subGroup) {
			throw new Error(
				`Unable to unsubscribe from ${action} action. There are no callback handlers for this action`,
			);
		}

		this.subscribers.set(action, subGroup.filter(cb => cb !== callback));
	};

	public sendMessage = (
		targetwindow: Window,
		action: OutgoingMessageActions,
		payload: OutgoingMessageParamByAction<typeof action>,
	) => {
		targetwindow.postMessage({
			action,
			payload,
			publisher: Apps.ActUI,
		}, window.location.origin);
	};

	public dispose = () => {
		window.removeEventListener('message', this.handleIncomingMessage);
	};
}
