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

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../hooks/useStore';
import '../styles/message-history.scss';
import '../styles/splitter.scss';
import { downloadFile } from '../helpers/downloadFile';
import { ParsedMessageHistoryItem, ActMessageHistoryItem } from '../models/Message';
import MessageList from './MessageList';

const MessageHistory = () => {
	const { currentHistoryStore, selectedSchemaType } = useStore();
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
			const messages = JSON.parse(rawFromFile) as Array<
				ParsedMessageHistoryItem | ActMessageHistoryItem
			>;
			currentHistoryStore.clearHistory();
			messages.forEach(message =>
				currentHistoryStore.addMessage(message as ParsedMessageHistoryItem & ActMessageHistoryItem),
			);
		} catch (error) {
			// eslint-disable-next-line no-alert
			alert('Failed to read the file. Please, try to select another file');
		}
	};

	useEffect(() => {
		isReplayRef.current = isReplay;
		if (isReplay) {
			currentHistoryStore.setEditMessageMode(false);
			currentHistoryStore.clearIndicators();
			replaySendMessage(currentHistoryStore.history, 0);
		}
	}, [isReplay]);

	const replaySendMessage = (
		array: ParsedMessageHistoryItem[] | ActMessageHistoryItem[],
		index: number,
	) => {
		if (isReplayRef.current && array.length > 0 && index < array.length) {
			setTimeout(() => {
				currentHistoryStore.replayMessage(array[index].id).then(() => {
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
			JSON.stringify(currentHistoryStore.history),
			selectedSchemaType === 'parsed-message' ? 'parsedMessages' : 'actMessages',
			'application/json',
		);
	};

	return (
		<div className={'message-history'.concat(currentHistoryStore.editMessageMode ? '_edited' : '')}>
			{currentHistoryStore.editMessageMode && (
				<div
					className={'add-new-message'}
					onClick={() => {
						currentHistoryStore.setEditMessageMode(false);
					}}>
					New Message
				</div>
			)}

			<div className='message-history__message-list-container'>
				<MessageList />
			</div>

			<div className='message-history__controls'>
				<button
					disabled={currentHistoryStore.editMessageMode}
					className='message-history__controls-button'
					onClick={currentHistoryStore.clearHistory}>
					Clear
				</button>

				<button
					disabled={currentHistoryStore.history.length === 0}
					className='message-history__controls-button'
					onClick={exportFn}>
					Export
				</button>

				<button
					disabled={currentHistoryStore.editMessageMode || currentHistoryStore.history.length === 0}
					className='message-history__controls-button'
					onClick={() => {
						setReplayMode(!isReplay);
					}}>
					{isReplay ? (
						<div style={{ display: 'flex' }}>
							<div className='spinner' />
							Stop
						</div>
					) : (
						'Replay'
					)}
				</button>

				<input
					disabled={currentHistoryStore.editMessageMode}
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
