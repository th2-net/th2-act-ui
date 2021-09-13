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
	Droppable, DroppableProvided, DropResult, DragDropContext,
} from 'react-beautiful-dnd';
import { nanoid } from '../../node_modules/nanoid';
import { useStore } from '../hooks/useStore';
import '../styles/message-list.scss';
import '../styles/splitter.scss';
import { reorderArray } from '../helpers/reorderArrayWithDragAndDrop';
import { ParsedMessageItem, ActMessageItem } from '../models/Message';
import DraggableMessageItem from './MessageItem';

export type Indicator =
	| 'indicator-unvisible'
	| 'indicator-edited'
	| 'indicator-successful'
	| 'indicator-unsuccessful';

const MessageList = (props: {
	messages: ParsedMessageItem[] | ActMessageItem[];
	editMessageMode: boolean;
}) => {
	const store = useStore();
	const messageListDataStore = store.messageListDataStore;

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
		reorderArray(destination.index, source.index, array[source.index], { array });
	};

	return (
		<DragDropContext onDragEnd={dragEndHandler}>
			<div className='scrolledBlock'>
				<Droppable droppableId='droppableId'>
					{(provided: DroppableProvided) => (
						<ul {...provided.droppableProps} ref={provided.innerRef}>
							<li>
								{props.editMessageMode ? (
									<div
										className={'normalNewMessage'}
										onClick={() => {
											const selection = window.getSelection();
											if (selection?.toString().length === 0) {
												messageListDataStore.setEditMessageMode(false);
											}
										}}>
										New Message
									</div>
								) : null}
							</li>
							{(
								(props.messages as ParsedMessageItem[])
								|| (props.messages as ActMessageItem[])
							).map((item: ParsedMessageItem | ActMessageItem, index: number) => (
								<DraggableMessageItem
									key={item.id}
									keyId={item.id || nanoid()}
									index={index}
									message={item}
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
