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
import { Draggable, DraggableProvided, DraggableStateSnapshot, DroppableProvided } from 'react-beautiful-dnd';
import { IconButton, InputAdornment, TableBody, TableCell, TableRow, TextField } from '@mui/material';
import { DeleteOutline, DriveFileMove, Edit, ReorderRounded, Save } from '@mui/icons-material';
import { blue, red } from '@mui/material/colors';
import { observer } from 'mobx-react-lite';
import { nanoid } from 'nanoid';
import {
	ActReplayItem,
	isActReplayItem,
	isParsedMessageReplayItem,
	ParsedMessageReplayItem,
} from '../../models/Message';
import useReplayStore from '../../hooks/useReplayStore';
import { useRootStore } from '../../hooks/useRootStore';
import ReplayStatusCell from './ReplayStatusCell';
import useEditorStore from '../../hooks/useEditorStore';

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
		editedMessageId,
		saveEditedMessage,
		editMessageMode,
	} = useReplayStore();
	const { editorStore, messagesStores } = useRootStore();
	const { options } = editorStore;
	const { code } = useEditorStore();

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
			<TableRow sx={{ bgcolor: editMessageMode ? 'white' : blue[50] }}>
				<TableCell colSpan={2}>New Message</TableCell>
				<TableCell>{options.parsedMessage.selectedSession}</TableCell>
				<TableCell>{options.parsedMessage.selectedDictionary}</TableCell>
				<TableCell colSpan={4}>{options.parsedMessage.selectedMessageType}</TableCell>
				<TableCell>
					{editMessageMode && (
						<IconButton title='Edit message' onClick={() => setEditMessageMode(false)}>
							<Edit />
						</IconButton>
					)}
					<IconButton
						title='Save to replay'
						disabled={!options.parsedMessage.selectedOptions}
						onClick={() => {
							if (options.parsedMessage.selectedOptions) {
								messagesStores.parsedMessage.replayStore.addMessage({
									id: nanoid(),
									message: code,
									...options.parsedMessage.selectedOptions,
									status: { type: 'ready' },
									createdAt: +new Date(),
									delay: 0,
								});
							}
						}}>
						<DriveFileMove />
					</IconButton>
				</TableCell>
			</TableRow>
			{(replayList as unknown as ActReplayItem[] & ParsedMessageReplayItem[]).map((replayItem, index: number) => (
				<Draggable draggableId={replayItem.id} index={index} key={replayItem.id}>
					{(draggableProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
						const isEditing = editedMessageId === replayItem.id;

						return (
							<TableRow
								ref={draggableProvided.innerRef}
								{...draggableProvided.draggableProps}
								sx={{
									opacity: snapshot.isDragging ? '0.80' : '1',
									bgcolor: isEditing ? blue[50] : 'white',
								}}>
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
									{isEditing ? (
										<IconButton title='Save' onClick={() => saveEditedMessage()}>
											<Save />
										</IconButton>
									) : (
										<IconButton title='Edit message' onClick={() => handleEditCodeClicked(index)}>
											<Edit />
										</IconButton>
									)}
									<IconButton title='Remove' onClick={() => removeMessage(replayItem.id)}>
										<DeleteOutline sx={{ color: red[500] }} />
									</IconButton>
								</TableCell>
							</TableRow>
						);
					}}
				</Draggable>
			))}
			{droppableProvided.placeholder}
		</TableBody>
	);
};

export default observer(ReplayTableBody);
