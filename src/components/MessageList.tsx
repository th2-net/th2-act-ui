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
import {
	Droppable,
	DroppableProvided,
	DropResult,
	DragDropContext,
	Draggable,
	DraggableProvided,
	DraggableStateSnapshot,
} from 'react-beautiful-dnd';
import { nanoid } from '../../node_modules/nanoid';
import { useStore } from '../hooks/useStore';
import '../styles/message-list.scss';
import '../styles/splitter.scss';
import SplitView from '../split-view/SplitView';
import SplitViewPane from '../split-view/SplitViewPane';
import { downloadFile } from '../helpers/downloadFile';
import { reorderArray } from '../helpers/reorderArrayWithDragAndDrop';
import {
	ParsedMessageItem,
	ActMessageItem,
	isParsedMessageItem,
	isActMessageItem,
} from '../models/Message';

export type Indicator =
	| 'indicator-unvisible'
	| 'indicator-edited'
	| 'indicator-successful'
	| 'indicator-unsuccessful';

interface EditMessageProps {
	editMessageMode: boolean;
	editedMessageIndex: number;
	indicators: Indicator[];
}

const Messages = () => {
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
		<div>
			<MessageEditArea
				messages={messageListDataStore.getCurrentMessagesArray}
				indicators={messageListDataStore.indicators.slice()}
				editMessageMode={messageListDataStore.editMessageMode}
				editedMessageIndex={messageListDataStore.editedMessageIndex}
				messageListPanelArea={50}
				object={store.selectedDictionaryName}
			/>

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
					disabled={messageListDataStore.editMessageMode
						|| messageListDataStore.getCurrentMessagesArray.length === 0}
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

const MessageEntity = (props: { message: ParsedMessageItem | ActMessageItem }) => {
	if (isParsedMessageItem(props.message)) {
		return (
			<div className='messageEntity'>
				<p>
					<b>session: </b>
					{props.message.sessionId}
				</p>
				<p>
					<b>dictionary: </b>
					{props.message.dictionary}
				</p>
				<p>
					<b>messageType: </b>
					{props.message.messageType}
				</p>
			</div>
		);
	}
	if (isActMessageItem(props.message)) {
		return (
			<div>
				<p>
					<b>actBox: </b>
					{props.message.actBox}
				</p>
				<p>
					<b>fullServiceName: </b>
					{props.message.fullServiceName}
				</p>
				<p>
					<b>methodName: </b>
					{props.message.methodName}
				</p>
			</div>
		);
	}
	return null;
};

interface MessageItemProps extends EditMessageProps {
	index: number;
	message: ParsedMessageItem | ActMessageItem;
	selectMessage: (index: number) => void;
	setDelay: (index: number) => void;
	deleteMessage: (index: number) => void;
}

const MessageItem = ({
	index,
	message,
	indicators,
	selectMessage,
	setDelay,
	deleteMessage,
	editMessageMode,
	editedMessageIndex,
}: MessageItemProps) => {
	const [delay, setDelayValue] = useState(message.delay.toString());
	return (
		<div className='messageCard'>
			<div
				onClick={() => {
					selectMessage(index);
				}}>
				<MessageEntity message={message} />
				<p>
					<b>delay: </b>
					{editMessageMode && editedMessageIndex === index ? (
						<input
							className='delayInput'
							type='number'
							value={delay}
							onChange={e => {
								setDelay(Number(e.target.value));
								setDelayValue(e.target.value);
							}}
						/>
					) : (
						message.delay
					)}
					ms
				</p>
			</div>
			<MessageCardControls
				deleteMessage={deleteMessage}
				editMessageMode={editMessageMode}
				index={index}
				indicator={indicators[index]}
			/>
		</div>
	);
};

interface MessageCardControlsProps {
	deleteMessage: (index: number) => void;
	editMessageMode: boolean;
	index: number;
	indicator: Indicator;
}

const MessageCardControls = ({
	deleteMessage,
	editMessageMode,
	index,
	indicator,
}: MessageCardControlsProps) => (
	<div className='cardControls'>
		<button
			disabled={editMessageMode}
			className='deleteButton'
			onClick={() => {
				deleteMessage(index);
			}}>
			x
		</button>
		<Indicator className={indicator} />
	</div>
);

const Indicator = (props: { className: Indicator }) => (
	<div>
		<button className={props.className}></button>
	</div>
);

interface MessageListProps extends EditMessageProps {
	messages: ParsedMessageItem[] | ActMessageItem[];
}

const MessageList = ({
	indicators,
	messages,
	editMessageMode,
	editedMessageIndex,
}: MessageListProps) => {
	const messageListDataStore = useStore().messageListDataStore;

	const deleteMessage = (index: number) => {
		const newArray: any[] = [];

		const tmpIndicators: Indicator[] = messageListDataStore.deleteIndicator(index);
		messageListDataStore.getCurrentMessagesArray.forEach(
			(item: ParsedMessageItem | ActMessageItem, i: number) => {
				if (i !== index) {
					newArray.push(item);
				}
			},
		);
		messageListDataStore.clearParsedMessages();
		newArray.forEach((mess: ParsedMessageItem | ActMessageItem, i) => {
			messageListDataStore.addParsedMessage(mess, tmpIndicators[i]);
		});
	};

	const setDelay = (delay: number) => {
		messageListDataStore.setEditedMessageSendDelay(delay);
	};

	const dragEndHandler = (result: DropResult) => {
		messageListDataStore.clearIndicators();
		const { destination, source } = result;
		if (!destination) {
			return;
		}
		if (destination.droppableId === source.droppableId && destination.index === source.index) {
			return;
		}
		const array = messageListDataStore.getCurrentMessagesArray;
		reorderArray(destination.index,
			source.index, messages[source.index],
		 	{ array });
	};

	return (
		<DragDropContext onDragEnd={dragEndHandler}>
			<div className='scrolledBlock'>
				<Droppable droppableId='droppableId'>
					{(provided: DroppableProvided) => (
						<ul {...provided.droppableProps} ref={provided.innerRef}>
							<li>
								{editMessageMode ? (
									<div
										className={'normalNewMessage'}
										onClick={() => {
											messageListDataStore.setEditMessageMode(false);
										}}>
										New Message
									</div>
								) : null}
							</li>
							{(
								(messages as ParsedMessageItem[]) || (messages as ActMessageItem[])
							).map((item: ParsedMessageItem | ActMessageItem, index: number) => (
								<DraggableMessageItem
									key={item.id}
									keyId={item.id || nanoid()}
									index={index}
									message={item}
									indicators={indicators}
									editMessageMode={editMessageMode}
									editedMessageIndex={editedMessageIndex}
									selectMessage={messageListDataStore.selectMessage}
									deleteMessage={deleteMessage}
									setDelay={setDelay}
								/>
							))}
							{provided.placeholder}
						</ul>
					)}
				</Droppable>
			</div>
		</DragDropContext>
	);
};

interface DraggableMessageItemProps extends MessageItemProps {
	keyId: string;
}

const DraggableMessageItem = ({
	index,
	message,
	indicators,
	selectMessage,
	setDelay,
	deleteMessage,
	editMessageMode,
	editedMessageIndex,
	keyId,
}: DraggableMessageItemProps) => (
	<Draggable draggableId={keyId} index={index} key={keyId}>
		{(prov: DraggableProvided, snapshot: DraggableStateSnapshot) => (
			<li
				{...prov.draggableProps}
				ref={prov.innerRef}
				key={keyId}
				draggable={true}
				className={snapshot.isDragging ? 'messageItemDragging' : 'messageItem'}>
				<div className='message'>
					<div className='handler'>
						<div
							style={{ visibility: editMessageMode ? 'hidden' : 'visible' }}
							{...prov.dragHandleProps}
							className='move'></div>
					</div>
					<MessageItem
						index={index}
						message={message}
						indicators={indicators}
						editMessageMode={editMessageMode}
						editedMessageIndex={editedMessageIndex}
						selectMessage={selectMessage}
						deleteMessage={deleteMessage}
						setDelay={setDelay}
					/>
				</div>
			</li>
		)}
	</Draggable>
);

const EmbeddedEditor = (props: { schema: string; object: string }) => {
	const url = `http://localhost:3000?schema=${props.schema}&${
		props.object == null ? '' : `object=${props.object}`
	}&editorMode=dictionaryEditor&embedded=true`;
	return (
		<div className='scrolledBlock'>
			<iframe className='embeddedEditor' src={url}></iframe>
		</div>
	);
};

interface MessageEditAreaProps extends EditMessageProps {
	messages: ParsedMessageItem[] | ActMessageItem[];
	messageListPanelArea: number;
	object: string | null;
}

const MessageEditArea = ({
	editMessageMode,
	indicators,
	messages,
	editedMessageIndex,
	messageListPanelArea,
	object,
}: MessageEditAreaProps) => {
	const store = useStore();
	const [panelArea, setPanelArea] = useState(messageListPanelArea);
	return (
		<div className='messageEditArea'>
			{store.selectedSchemaType === 'parsed-message' ? (
				<SplitView panelArea={panelArea} onPanelAreaChange={setPanelArea}>
					<SplitViewPane>
						<MessageList
							messages={messages}
							indicators={indicators}
							editMessageMode={editMessageMode}
							editedMessageIndex={editedMessageIndex}
						/>
					</SplitViewPane>

					<SplitViewPane>
						<EmbeddedEditor schema='schema-qa' object={object || ''} />
					</SplitViewPane>
				</SplitView>
			) : (
				<MessageList
					messages={messages}
					indicators={indicators}
					editMessageMode={editMessageMode}
					editedMessageIndex={editedMessageIndex}
				/>
			)}
		</div>
	);
};

export default observer(Messages);
