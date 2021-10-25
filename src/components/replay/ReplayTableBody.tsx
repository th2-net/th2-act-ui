import React from 'react';
import { Draggable, DraggableProvided, DraggableStateSnapshot, DroppableProvided } from 'react-beautiful-dnd';
import { IconButton, TableBody, TableCell, TableRow, TextField } from '@mui/material';
import { DeleteOutline, Edit, ReorderRounded } from '@mui/icons-material';
import { blue, green, red, yellow } from '@mui/material/colors';
import { observer } from 'mobx-react-lite';
import {
	ActReplayItem,
	isActReplayItem,
	isParsedMessageReplayItem,
	ParsedMessageReplayItem,
	ReplayStatus,
} from '../../models/Message';
import useMessageHistoryStore from '../../hooks/useMessageHistoryStore';

type Props = {
	droppableProvided: DroppableProvided;
};

const colors: Record<ReplayStatus, string> = {
	ready: blue[500],
	edited: yellow[500],
	success: green[500],
	fail: red[500],
};

const ReplayTableBody = ({ droppableProvided }: Props) => {
	const { replayList, renameMessage, changeDelay, removeMessage } = useMessageHistoryStore();

	return (
		<TableBody ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
			{(replayList as unknown as ActReplayItem[] & ParsedMessageReplayItem[]).map((replayItem, index: number) => (
				<Draggable draggableId={replayItem.id} index={index} key={replayItem.id}>
					{(draggableProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
						<TableRow
							ref={draggableProvided.innerRef}
							{...draggableProvided.draggableProps}
							sx={{ opacity: snapshot.isDragging ? '0.80' : '1' }}>
							<TableCell>
								<div {...draggableProvided.dragHandleProps}>
									<ReorderRounded />
								</div>
							</TableCell>
							<TableCell>
								<TextField
									placeholder='Untitled'
									value={replayItem.name ?? ''}
									onChange={e => renameMessage(replayItem.id, e.target.value)}
									size='small'
									variant='standard'
									sx={{ minWidth: 60 }}
								/>
							</TableCell>
							{isActReplayItem(replayItem) && (
								<>
									<TableCell>{replayItem.actBox}</TableCell>
									<TableCell>{replayItem.fullServiceName}</TableCell>
									<TableCell>{replayItem.methodName}</TableCell>
								</>
							)}
							{isParsedMessageReplayItem(replayItem) && (
								<>
									<TableCell>{replayItem.session}</TableCell>
									<TableCell>{replayItem.dictionary}</TableCell>
									<TableCell>{replayItem.messageType}</TableCell>
								</>
							)}
							<TableCell>{new Date(replayItem.createdAt).toLocaleString()}</TableCell>
							<TableCell>
								<TextField
									value={replayItem.delay}
									onChange={e => changeDelay(replayItem.id, parseInt(e.target.value))}
									size='small'
									type='number'
									variant='standard'
									sx={{ minWidth: 60 }}
								/>
							</TableCell>
							<TableCell sx={{ color: colors[replayItem.status] }}>
								{replayItem.status.toUpperCase()}
							</TableCell>
							<TableCell sx={{ whiteSpace: 'nowrap' }}>
								<IconButton title='Edit code'>
									<Edit />
								</IconButton>
								<IconButton title='Remove' onClick={() => removeMessage(replayItem.id)}>
									<DeleteOutline sx={{ color: red[500] }} />
								</IconButton>
							</TableCell>
						</TableRow>
					)}
				</Draggable>
			))}
			{droppableProvided.placeholder}
		</TableBody>
	);
};

export default observer(ReplayTableBody);