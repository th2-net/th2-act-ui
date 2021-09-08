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
import {
	Droppable,
	DroppableProvided,
	DropResult,
	DragDropContext,
} from 'react-beautiful-dnd';
import { nanoid } from '../../node_modules/nanoid';
import { useStore } from '../hooks/useStore';
import '../styles/message-list.scss';
import '../styles/splitter.scss';
import { reorderArray } from '../helpers/reorderArrayWithDragAndDrop';
import {
	ParsedMessageItem,
	ActMessageItem,
} from '../models/Message';
import DraggableMessageItem from './MessageItem';

export type Indicator =
	| 'indicator-unvisible'
	| 'indicator-edited'
	| 'indicator-successful'
	| 'indicator-unsuccessful';

export interface EditMessageProps {
	editMessageMode: boolean;
	editedMessageId: string;
	indicators: Indicator[];
}

interface MessageListProps extends EditMessageProps {
	messages: ParsedMessageItem[] | ActMessageItem[];
}

const MessageList = ({
	indicators,
	messages,
	editMessageMode,
	editedMessageId,
}: MessageListProps) => {
	const messageListDataStore = useStore().messageListDataStore;

	const deleteMessage = (id: string) => {
		const newArray: any[] = [];

		messageListDataStore.getCurrentMessagesArray.forEach(
			(item: ParsedMessageItem | ActMessageItem, i: number) => {
				if (item.id !== id) {
					newArray.push(item);
					messageListDataStore.deleteIndicator(i);
				}
			},
		);
		messageListDataStore.clearParsedMessages();
		newArray.forEach((mess: ParsedMessageItem | ActMessageItem, i) => {
			messageListDataStore.addParsedMessage(mess, messageListDataStore.indicators[i]);
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
		reorderArray(destination.index, source.index, messages[source.index], { array });
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
									editedMessageId={editedMessageId}
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

export default observer(MessageList);
