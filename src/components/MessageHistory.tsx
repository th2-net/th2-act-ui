/* eslint-disable @typescript-eslint/no-explicit-any */
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

import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../hooks/useStore';
import '../styles/message-list.scss';
import '../styles/splitter.scss';
import { downloadFile } from '../helpers/downloadFile';
import { ParsedMessageItem, ActMessageItem } from '../models/Message';
import MessageList from './MessageList';

const MessageHistory = (props: { messages: ParsedMessageItem[] | ActMessageItem[] }) => {
	const store = useStore();
	const messageListDataStore = store.messageListDataStore;
	const [isReplay, setReplayMode] = useState(false);
	const isReplayRef = useRef(isReplay);

	const loadFromFile = (file: FileList | null) => {
		if (file != null) {
			const reader = new FileReader();
			reader.readAsText(file.item(0) as Blob);
			reader.onload = () => {
				if (typeof reader.result === 'string') {
					jsonMessagesFromString(reader.result);
				}
			};
		}
	};

	const jsonMessagesFromString = (rawFromFile: string) => {
		try {
			const json = JSON.parse(rawFromFile);
			messageListDataStore.clearParsedMessages();

			for (let i = 0; i < json.length; i++) {
				messageListDataStore.addParsedMessage(json[i]);
			}
		} catch (error) {
			// eslint-disable-next-line no-alert
			alert('Failed to read the file. Please, try to select another file');
		}
	};

	useEffect(() => {
		isReplayRef.current = isReplay;
		if (isReplay) {
			messageListDataStore.setEditMessageMode(false);
			messageListDataStore.clearIndicators();
			replaySendMessage(messageListDataStore.getCurrentMessagesArray, 0);
		}
	}, [isReplay]);

	const replaySendMessage = (array: ParsedMessageItem[] | ActMessageItem[], index: number) => {
		if (isReplayRef.current && array.length > 0 && index < array.length) {
			setTimeout(() => {
				store.replayMessage(array[index], index).then(() => {
					if (index === array.length - 1) {
						setReplayMode(false);
					} else {
						replaySendMessage(array, index + 1);
					}
				});
			}, array[index].delay);
		}
	};

	const exportFn = () => {
		downloadFile(
			JSON.stringify(messageListDataStore.getCurrentMessagesArray),
			store.selectedSchemaType === 'parsed-message' ? 'parsedMessages' : 'actMessages',
			'application/json',
		);
	};

	return (
		<div className='historyTab'>
			{messageListDataStore.editMessageMode
				? <div
					className={'normalNewMessage'}
					onClick={() => {
						messageListDataStore.setEditMessageMode(false);
					}}>
									New Message
				</div> : <div></div>}

			<MessageList messages={props.messages} editMessageMode={messageListDataStore.editMessageMode}/>

			<div className='messageEditAreaControls'>
				<button
					disabled={messageListDataStore.editMessageMode}
					className='mainButton'
					onClick={messageListDataStore.clearParsedMessages}>
					Clear
				</button>

				<button
					disabled={messageListDataStore.getCurrentMessagesArray.length === 0}
					className='mainButton'
					onClick={exportFn}>
					Export
				</button>

				<button
					disabled={
						messageListDataStore.editMessageMode
                        || messageListDataStore.getCurrentMessagesArray.length === 0
					}
					className='mainButton'
					onClick={() => {
						setReplayMode(!isReplay);
					}}>
					{isReplay ? (
						<div style={{ display: 'flex' }}>
							<div className='spinner'></div>Stop
						</div>
					) : (
						'Replay'
					)}
				</button>

				<input
					disabled={messageListDataStore.editMessageMode}
					value=''
					id='file'
					type='file'
					accept='.json'
					onChange={e => {
						loadFromFile(e.target.files);
					}}
				/>
			</div>
		</div>
	);
};

export default observer(MessageHistory);
