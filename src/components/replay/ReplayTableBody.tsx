import React from 'react';
import { Draggable, DraggableProvided, DraggableStateSnapshot, DroppableProvided } from 'react-beautiful-dnd';
import { IconButton, InputAdornment, TableBody, TableCell, TableRow, TextField } from '@mui/material';
import { DeleteOutline, Edit, ReorderRounded } from '@mui/icons-material';
import { red } from '@mui/material/colors';
import { observer } from 'mobx-react-lite';
import {
	ActReplayItem,
	isActReplayItem,
	isParsedMessageReplayItem,
	ParsedMessageReplayItem,
} from '../../models/Message';
import useMessageHistoryStore from '../../hooks/useMessageHistoryStore';
import { useRootStore } from '../../hooks/useRootStore';
import ReplayStatusCell from './ReplayStatusCell';

type Props = {
	droppableProvided: DroppableProvided;
};

const ReplayTableBody = ({ droppableProvided }: Props) => {
	const {
		replayList,
		renameMessage,
		changeDelay,
		removeMessage,
		setEditedMessageId,
		setEditMessageMode,
		setEditedMessageCode,
	} = useMessageHistoryStore();
	const { editorStore } = useRootStore();
	const { options } = editorStore;

	const handleEditCodeClicked = (replayItemIndex: number) => {
		const replayItem = replayList[replayItemIndex];

		if (isActReplayItem(replayItem)) {
			options.act.selectAct(replayItem.actBox);
			options.act.selectService(replayItem.fullServiceName);
			options.act.selectMethod(replayItem.methodName);
		} else if (isParsedMessageReplayItem(replayItem)) {
			options.parsedMessage.selectSession(replayItem.session);
			options.parsedMessage.selectDictionary(replayItem.dictionary);
			options.parsedMessage.selectMessageType(replayItem.messageType);
		}

		setEditedMessageId(replayItem.id);
		setEditedMessageCode(replayItem.message);
		setEditMessageMode(true);
	};

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
									sx={{ minWidth: 90 }}
									InputProps={{
										endAdornment: <InputAdornment position='end'>ms</InputAdornment>,
									}}
								/>
							</TableCell>
							<ReplayStatusCell status={replayItem.status} />
							<TableCell sx={{ whiteSpace: 'nowrap' }}>
								<IconButton title='Edit code' onClick={() => handleEditCodeClicked(index)}>
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
