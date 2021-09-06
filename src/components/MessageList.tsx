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
			store.clearParsedMessages();

			for (let i = 0; i < json.length; i++) {
				store.addParsedMessage(json[i]);
			}
		} catch (error) {
			// eslint-disable-next-line no-alert
			alert('Failed to read the file. Please, try to select another file');
		}
	};

	useEffect(() => {
		isReplayRef.current = isReplay;
		if (isReplay) {
			store.setEditMessageMode(false);
			replaySendMessage(store.getCurrentMessagesArray, 0);
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
			JSON.stringify(store.getCurrentMessagesArray),
			store.selectedSchemaType === 'parsed-message' ? 'parsedMessages' : 'actMessages',
			'application/json',
		);
	};

	return (
		<div>
			<MessageEditArea
				messages={store.getCurrentMessagesArray}
				indicators={store.indicators.slice()}
				editMessageMode={store.editMessageMode}
				editedMessageIndex={store.editedMessageIndex}
				messageListPanelArea={store.messageListPanelArea}
				object={store.selectedDictionaryName}
			/>

			<div className='messageEditAreaControls'>
				<button
					disabled={store.editMessageMode}
					className='mainButton'
					onClick={store.clearParsedMessages}>
					Clear
				</button>

				<button
					disabled={store.getCurrentMessagesArray.length === 0}
					className='mainButton'
					onClick={exportFn}>
					Export
				</button>

				<button
					disabled={store.editMessageMode || store.getCurrentMessagesArray.length === 0}
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
					disabled={store.editMessageMode}
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
	const store = useStore();

	const deleteMessage = (index: number) => {
		const newArray: any[] = [];

		const tmpIndicators: Indicator[] = store.deleteIndicator(index);
		store.getCurrentMessagesArray.forEach(
			(item: ParsedMessageItem | ActMessageItem, i: number) => {
				if (i !== index) {
					newArray.push(item);
				}
			},
		);
		store.clearParsedMessages();
		newArray.forEach((mess: ParsedMessageItem | ActMessageItem, i) => {
			store.addParsedMessage(mess, tmpIndicators[i]);
		});
	};

	const setDelay = (delay: number) => {
		store.setEditedMessageSendDelay(delay);
	};

	const dragEndHandler = (result: DropResult) => {
		store.clearIndicators();
		const { destination, source } = result;
		if (!destination) {
			return;
		}
		if (destination.droppableId === source.droppableId && destination.index === source.index) {
			return;
		}
		store.reorderMessagesArray(destination.index, source.index, messages[source.index]);
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
											store.setEditMessageMode(false);
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
									selectMessage={store.selectMessage}
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
	return (
		<div className='messageEditArea'>
			{store.selectedSchemaType === 'parsed-message' ? (
				<SplitView panelArea={messageListPanelArea} onPanelAreaChange={store.setPanelArea}>
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
