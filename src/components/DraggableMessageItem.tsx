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

import React from 'react';
import { observer } from 'mobx-react-lite';
import { Draggable, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import '../styles/message-list.scss';
import '../styles/indicator.scss';
import { ParsedMessageHistoryItem, ActMessageHistoryItem } from '../models/Message';
import MessageItem from './MessageItem';

export interface MessageItemProps {
	index: number;
	message: ParsedMessageHistoryItem | ActMessageHistoryItem;
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

export default DraggableMessageItem;
