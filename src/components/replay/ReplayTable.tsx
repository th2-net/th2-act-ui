import React from 'react';
import { DragDropContext, Droppable, DroppableProvided, DropResult } from 'react-beautiful-dnd';
import { Table, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { observer } from 'mobx-react-lite';
import useMessageHistoryStore from '../../hooks/useMessageHistoryStore';
import ReplayTableBody from './ReplayTableBody';
import { isActReplayItem } from '../../models/Message';

// TODO: fix drag'n'drop
// TODO: add replay
const ReplayTable = () => {
	const { replayList, reorder } = useMessageHistoryStore();

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
