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
import { Draggable, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import '../styles/message-list.scss';
import {
	ParsedMessageItem,
	ActMessageItem,
	isParsedMessageItem,
	isActMessageItem,
} from '../models/Message';
import { Indicator } from './MessageList';
import { useStore } from '../hooks/useStore';
import { InputAdornment, TextField } from '../../node_modules/@material-ui/core';

interface MessageItemProps {
	index: number;
	message: ParsedMessageItem | ActMessageItem;
}

interface DraggableMessageItemProps extends MessageItemProps {
	keyId: string;
}

const DraggableMessageItem = ({ index, message, keyId }: DraggableMessageItemProps) => {
	const messageListDataStore = useStore().messageListDataStore;
	return (
		<Draggable draggableId={keyId} index={index} key={keyId}>
			{(prov: DraggableProvided, snapshot: DraggableStateSnapshot) => (
				<li
					{...prov.draggableProps}
					ref={prov.innerRef}
					key={keyId}
					draggable={false}
					className={snapshot.isDragging ? 'messageItemDragging' : 'messageItem'}>
					<div className='message'>
						<div className='dragHandlerContainer'>
							<div
								style={{
									visibility: messageListDataStore.editMessageMode
										? 'hidden'
										: 'visible',
								}}
								{...prov.dragHandleProps}
								draggable={true}
								className='dragHandler'></div>
						</div>
						<MessageItem index={index} message={message} />
					</div>
				</li>
			)}
		</Draggable>
	);
};

const MessageItem = ({ index, message }: MessageItemProps) => {
	const [delay, setDelayValue] = useState(message.delay.toString());
	const messageListDataStore = useStore().messageListDataStore;
	return (
		<div className='messageCard'>
			<div
				onClick={() => {
					const selection = window.getSelection();
					if (selection && selection?.toString().length === 0) {
						messageListDataStore.selectMessage(message.id || '');
					}
				}}>
				<MessageEntity message={message} />
				<b style={{ marginRight: '10px' }}>delay:</b>
				<TextField
					variant='standard'
					className='delayInput'
					type='number'
					InputProps={{
						endAdornment: <InputAdornment position="end">ms</InputAdornment>,
						  }}
					size='small'
					value={delay}
					onChange={e => {
						messageListDataStore.setEditedMessageSendDelay(
							Number(e.target.value),
						);
						setDelayValue(e.target.value);
					}}
				/>
			</div>
			<MessageCardControls
				id={message.id || ''}
				indicator={message.indicator}
				message={message}
				index={index}
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
					<b> dictionary: </b>
					{props.message.dictionary}
					<b> messageType: </b>
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

const MessageCardControls = (props: {
	id: string;
	indicator: Indicator;
	message: ParsedMessageItem | ActMessageItem;
	index: number;
}) => {
	const messageListDataStore = useStore().messageListDataStore;
	return (
		<div className='cardControls'>
			<button
				disabled={messageListDataStore.editMessageMode}
				className='deleteButton'
				onClick={() => {
					messageListDataStore.deleteMessage(props.id);
				}}>
				x
			</button>
			<div>
				<button
					className={
						messageListDataStore.getCurrentMessagesArray.slice()[props.index].indicator
					}></button>
			</div>
		</div>
	);
};

export default DraggableMessageItem;
