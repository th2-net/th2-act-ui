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
import { Droppable, DroppableProvided, DropResult, DragDropContext } from 'react-beautiful-dnd';
import { useStore } from '../hooks/useStore';
import '../styles/message-list.scss';
import '../styles/splitter.scss';
import { reorderArray } from '../helpers/reorderArrayWithDragAndDrop';
import DraggableMessageList from './DraggableMessageList';

export type Indicator =
	| 'indicator_unvisible'
	| 'indicator_edited'
	| 'indicator_successful'
	| 'indicator_unsuccessful';

const MessageList = () => {
	const { currentHistoryStore: messageListDataStore } = useStore();

	const dragEndHandler = (result: DropResult) => {
		messageListDataStore.clearIndicators();
		const { destination, source } = result;
		if (!destination) {
			return;
		}
		if (destination.droppableId === source.droppableId && destination.index === source.index) {
			return;
		}
		const array = messageListDataStore.history;
		reorderArray(destination.index, source.index, array[source.index], {
			array,
		});
	};

	return (
		<DragDropContext onDragEnd={dragEndHandler}>
			<div className='message-list'>
				<Droppable droppableId='droppableId'>
					{(provided: DroppableProvided) => (
						<ul {...provided.droppableProps} ref={provided.innerRef}>
							<DraggableMessageList />
							{provided.placeholder}
						</ul>
					)}
				</Droppable>
			</div>
		</DragDropContext>
	);
};

export default observer(MessageList);
