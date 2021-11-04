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
import { IconButton, TableBody, TableCell, TableRow } from '@mui/material';
import { DriveFileMove, Edit } from '@mui/icons-material';
import { blue } from '@mui/material/colors';
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
import useEditorStore from '../../hooks/useEditorStore';
import ReplayTableRow from './ReplayTableRow';
import SimpleKeyValueCell from './SimpleKeyValueCell';

type Props = {
	droppableProvided: DroppableProvided;
};

const ReplayTableBody = ({ droppableProvided }: Props) => {
	const {
		replayList,
		renameReplayItem,
		changeDelay,
		removeReplayItem,
		setEditedReplayItemId,
		setEditReplayItemMode,
		setEditedReplayItemCode,
		editedReplayItemId,
		saveEditedReplayItem,
		editReplayItemMode,
		addToReplayList,
	} = useReplayStore();
	const { editorStore, schemaType, setSchemaType } = useRootStore();
	const { options } = editorStore;
	const { code } = useEditorStore();

	const handleEditCodeClicked = (replayItemIndex: number) => {
		const replayItem = replayList[replayItemIndex];

		if (isActReplayItem(replayItem)) {
			setSchemaType('act');
			options.act.selectAct(replayItem.actBox);
			options.act.selectService(replayItem.fullServiceName);
			options.act.selectMethod(replayItem.methodName);
		} else if (isParsedMessageReplayItem(replayItem)) {
			setSchemaType('parsedMessage');
			options.parsedMessage.selectSession(replayItem.session);
			options.parsedMessage.selectDictionary(replayItem.dictionary);
			options.parsedMessage.selectMessageType(replayItem.messageType);
		}

		setEditedReplayItemId(replayItem.id);
		setEditedReplayItemCode(replayItem.message);
		setEditReplayItemMode(true);
	};

	const saveToReplay = React.useCallback(() => {
		if (schemaType === 'act') {
			const { selectedOptions } = options.act;

			if (selectedOptions) {
				const replayItem: ActReplayItem = {
					type: 'act',
					id: nanoid(),
					delay: 0,
					createdAt: +new Date(),
					message: code,
					status: {
						type: 'ready',
					},
					...selectedOptions,
				};

				addToReplayList(replayItem);
			}
		} else {
			const { selectedOptions } = options.parsedMessage;

			if (selectedOptions) {
				const replayItem: ParsedMessageReplayItem = {
					type: 'parsedMessage',
					id: nanoid(),
					delay: 0,
					createdAt: +new Date(),
					message: code,
					status: {
						type: 'ready',
					},
					...selectedOptions,
				};

				addToReplayList(replayItem);
			}
		}
	}, [code, options, schemaType]);

	return (
		<TableBody ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
			<TableRow sx={{ bgcolor: editReplayItemMode ? 'white' : blue[50] }}>
				{schemaType === 'parsedMessage' ? (
					<>
						<TableCell colSpan={2}>New Message</TableCell>
						<SimpleKeyValueCell label='Session' value={options.parsedMessage.selectedSession ?? ''} />
						<SimpleKeyValueCell label='Dictionary' value={options.parsedMessage.selectedDictionary ?? ''} />
						<SimpleKeyValueCell
							label='Message Type'
							value={options.parsedMessage.selectedMessageType ?? ''}
							tableCellProps={{ colSpan: 4 }}
						/>
					</>
				) : (
					<>
						<TableCell colSpan={2}>New GRPC Call</TableCell>
						<SimpleKeyValueCell label='Box' value={options.act.selectedAct ?? ''} />
						<SimpleKeyValueCell label='Service' value={options.act.selectedService ?? ''} />
						<SimpleKeyValueCell
							label='Method'
							value={options.act.selectedMethod?.methodName ?? ''}
							tableCellProps={{ colSpan: 4 }}
						/>
					</>
				)}
				<TableCell>
					{editReplayItemMode && (
						<IconButton title='Edit item' onClick={() => setEditReplayItemMode(false)}>
							<Edit />
						</IconButton>
					)}
					<IconButton
						title='Save to replay'
						disabled={!editorStore.currentOptionsStore.selectedOptions}
						onClick={saveToReplay}>
						<DriveFileMove />
					</IconButton>
				</TableCell>
			</TableRow>
			{replayList.map((replayItem, index: number) => (
				<Draggable draggableId={replayItem.id} index={index} key={replayItem.id}>
					{(draggableProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
						<ReplayTableRow
							draggableProvided={draggableProvided}
							snapshot={snapshot}
							isEditing={editedReplayItemId === replayItem.id}
							replayItem={replayItem}
							changeDelay={delay => changeDelay(replayItem.id, delay)}
							save={saveEditedReplayItem}
							edit={() => handleEditCodeClicked(index)}
							remove={() => removeReplayItem(replayItem.id)}
							rename={newName => renameReplayItem(replayItem.id, newName)}
						/>
					)}
				</Draggable>
			))}
			{droppableProvided.placeholder}
		</TableBody>
	);
};

export default observer(ReplayTableBody);
