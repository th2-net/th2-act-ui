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
import { DragDropContext, Droppable, DroppableProvided, DropResult } from 'react-beautiful-dnd';
import { Table, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { observer } from 'mobx-react-lite';
import useReplayStore from '../../hooks/useReplayStore';
import ReplayTableBody from './ReplayTableBody';
import { isActReplayItem } from '../../models/Message';

// TODO: fix drag'n'drop
// TODO: add replay
const ReplayTable = () => {
	const { replayList, reorder } = useReplayStore();

	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) return;

		if (result.destination.index === result.source.index) return;

		reorder(result.destination.index, result.source.index);
	};

	return (
		<TableContainer className='scrollbar' sx={{ whiteSpace: 'nowrap' }}>
			<Table size='small'>
				<TableHead>
					<TableRow>
						<TableCell>&nbsp;</TableCell>
						<TableCell>Name</TableCell>
						{isActReplayItem(replayList[0]) ? (
							<>
								<TableCell>ActBox</TableCell>
								<TableCell>Service</TableCell>
								<TableCell>Method</TableCell>
							</>
						) : (
							<>
								<TableCell>Session</TableCell>
								<TableCell>Dictionary</TableCell>
								<TableCell>Msg Type</TableCell>
							</>
						)}
						<TableCell>Created at</TableCell>
						<TableCell>Delay</TableCell>
						<TableCell>Status</TableCell>
						<TableCell>Actions</TableCell>
					</TableRow>
				</TableHead>
				<DragDropContext onDragEnd={handleDragEnd}>
					<Droppable droppableId={'some id'} direction='vertical'>
						{(droppableProvided: DroppableProvided) => (
							<ReplayTableBody droppableProvided={droppableProvided} />
						)}
					</Droppable>
				</DragDropContext>
			</Table>
		</TableContainer>
	);
};

export default observer(ReplayTable);
