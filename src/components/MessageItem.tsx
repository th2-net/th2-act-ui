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
import { observer } from 'mobx-react-lite';
import { Draggable, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import '../styles/message-list.scss';
import '../styles/indicator.scss';
import { InputAdornment, TextField } from '@material-ui/core';
import {
	ParsedMessageItem,
	ActMessageItem,
	isParsedMessageItem,
	isActMessageItem,
} from '../models/Message';
import { useStore } from '../hooks/useStore';

interface MessageItemProps {
	index: number;
	message: ParsedMessageItem | ActMessageItem;
}

interface DraggableMessageItemProps extends MessageItemProps {
	keyId: string;
	editMessageMode: boolean;
}

const DraggableMessageItem = observer(
	({ index, message, keyId, editMessageMode }: DraggableMessageItemProps) => (
		<Draggable draggableId={keyId} index={index} key={keyId}>
			{(prov: DraggableProvided, snapshot: DraggableStateSnapshot) => (
				<li
					{...prov.draggableProps}
					ref={prov.innerRef}
					key={keyId}
					draggable={false}
					className={snapshot.isDragging ? 'message-list__item dragging' : 'message-list__item'}>
					<div
						className={
							editMessageMode
								? 'message-list__drag-handler-container_hidden'
								: 'message-list__drag-handler-container'
						}>
						<div
							{...prov.dragHandleProps}
							draggable={true}
							className='message-list__drag-handler'
						/>
					</div>
					<MessageItem index={index} message={message} />
				</li>
			)}
		</Draggable>
	),
);

const MessageItem = observer(({ index, message }: MessageItemProps) => {
	const { currentHistoryStore } = useStore();
	const [delay, setDelayValue] = useState(message.delay.toString());

	return (
		<div
			className={
				currentHistoryStore.editedMessageId === message.id
					? 'message-list__message-card_edited'
					: 'message-list__message-card'
			}>
			<div
				onClick={() => {
					const selection = window.getSelection();
					if (selection && selection?.toString().length === 0) {
						currentHistoryStore.selectMessage(message.id || '');
					}
				}}>
				<MessageEntity message={message} />
				<b style={{ marginRight: '10px' }}>delay:</b>
				<TextField
					variant='standard'
					className='message-list__delay-input'
					type='number'
					InputProps={{
						endAdornment: <InputAdornment position='end'>ms</InputAdornment>,
					}}
					size='small'
					value={delay}
					placeholder='0'
					onChange={e => {
						currentHistoryStore.setEditedMessageSendDelay(Number(e.target.value) || 0);
						setDelayValue(currentHistoryStore.editedMessageSendDelay.toString());
					}}
				/>
			</div>
			<MessageCardControls id={message.id} message={message} index={index} />
		</div>
	);
});

const MessageEntity = (props: { message: ParsedMessageItem | ActMessageItem }) => {
	if (isParsedMessageItem(props.message)) {
		return (
			<div className='message-list__message-content'>
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

const MessageCardControls = observer(
	(props: { id: string; message: ParsedMessageItem | ActMessageItem; index: number }) => {
		const { currentHistoryStore } = useStore();

		return (
			<div className='message-list__message-card-controls'>
				<button
					disabled={currentHistoryStore.editMessageMode}
					className='message-list__delete-message-btn'
					onClick={() => {
						currentHistoryStore.deleteMessage(props.id);
					}}>
					x
				</button>
				<div>
					<button className={props.message.indicator} />
				</div>
			</div>
		);
	},
);

export default DraggableMessageItem;
