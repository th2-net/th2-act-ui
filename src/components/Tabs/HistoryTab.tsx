/* eslint-disable @typescript-eslint/no-explicit-any */
/** ****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the License);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an AS IS BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

import React from 'react';
import { observer } from 'mobx-react-lite';
import useMessageWorker from '../../hooks/useMessageWorker';
import { IncomingMessageActions } from '../../stores/MessageWorker';
import { useStore } from '../../hooks/useStore';
import '../../styles/message-history.scss';
import '../../styles/splitter.scss';
import { EventMessage } from '../../models/Message';

const HistoryTab = () => {
	const {
		messageListDataStore,
		selectedDictionaryName,
		selectedMessageType,
		selectedSession,
	} = useStore();
	const messageWorker = useMessageWorker();

	React.useEffect(() => {
		const addToReplay = (message: EventMessage) => messageListDataStore.addToReplayList({
			id: message.messageId,
			sessionId: message.sessionId,
			dictionary: selectedDictionaryName ?? 'unknown',
			messageType: message.messageType,
			delay: 0,
			indicator: 'indicator_unvisible',
		});

		messageWorker.subscribeOnMessage(
			IncomingMessageActions.ReplayMessage,
			addToReplay,
		);

		return () => messageWorker.unsubscribeFromMessage(
			IncomingMessageActions.ReplayMessage,
			addToReplay,
		);
	}, []);

	const url = React.useMemo(() => {
		const messageStoreState = {
			timestampFrom: null,
			timestampTo: Date.now(),
			streams: [selectedSession],
			sse: {
				type: {
					hint: '',
					type: 'string[]',
					values: selectedMessageType ? [selectedMessageType] : [],
				},
			},
		};

		const messageStoreStateString = new URLSearchParams(
			{ messages: window.btoa(JSON.stringify(messageStoreState)) },
		);

		const isDev = process.env.NODE_ENV === 'development';

		return `${isDev
			? 'http://localhost:9001'
			: window.location.origin + window.location.pathname.replace('act-ui/', '')}`
			+ `${!isDev ? 'report-viewer' : ''}`
			+ `/?viewMode=embeddedMessages&${messageStoreStateString}`;
	}, [selectedMessageType, selectedSession]);

	if (!selectedSession) return null;

	return <iframe className='embedded-editor' src={url}></iframe>;
};

export default observer(HistoryTab);
