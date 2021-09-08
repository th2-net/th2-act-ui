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

import React, { useState } from 'react';
import {
	Draggable,
	DraggableProvided,
	DraggableStateSnapshot,
} from 'react-beautiful-dnd';
import '../styles/message-list.scss';
import {
	ParsedMessageItem,
	ActMessageItem,
	isParsedMessageItem,
	isActMessageItem,
} from '../models/Message';
import { Indicator, EditMessageProps } from './MessageList';

interface MessageCardControlsProps {
	deleteMessage: (id: string) => void;
	editMessageMode: boolean;
	id: string;
	indicator: Indicator;
}

interface MessageItemProps extends EditMessageProps {
	index: number;
	message: ParsedMessageItem | ActMessageItem;
	selectMessage: (id: string) => void;
	setDelay: (value: number) => void;
	deleteMessage: (id: string) => void;
}

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
	editedMessageId,
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
						editedMessageId={editedMessageId}
						selectMessage={selectMessage}
						deleteMessage={deleteMessage}
						setDelay={setDelay}
					/>
				</div>
			</li>
		)}
	</Draggable>
);

const MessageItem = ({
	index,
	message,
	indicators,
	selectMessage,
	setDelay,
	deleteMessage,
	editMessageMode,
	editedMessageId,
}: MessageItemProps) => {
	const [delay, setDelayValue] = useState(message.delay.toString());
	return (
		<div className='messageCard'>
			<div
				onClick={() => {
					selectMessage(message.id || '');
				}}>
				<MessageEntity message={message} />
				<p>
					<b>delay: </b>
					{editMessageMode && editedMessageId === message.id ? (
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
				id={message.id || ''}
				indicator={indicators[index]}
			/>
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

const MessageCardControls = ({
	deleteMessage,
	editMessageMode,
	id,
	indicator,
}: MessageCardControlsProps) => (
	<div className='cardControls'>
		<button
			disabled={editMessageMode}
			className='deleteButton'
			onClick={() => {
				deleteMessage(id);
			}}>
			x
		</button>
		<div>
			<button className={indicator}></button>
		</div>
	</div>
);

export default DraggableMessageItem;
