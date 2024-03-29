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
import { IconButton, TableBody, TableCell, TableRow, Tooltip } from '@mui/material';
import { DriveFileMove, Edit } from '@mui/icons-material';
import { blue } from '@mui/material/colors';
import { observer } from 'mobx-react-lite';
import { nanoid } from 'nanoid';
import { toJS } from 'mobx';
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
import useMessagesStore from '../../hooks/useMessagesStore';

type Props = {
	droppableProvided: DroppableProvided;
};

const ReplayTableBody = ({ droppableProvided }: Props) => {
	const {
		isReplaying,
		replayList,
		renameReplayItem,
		changeDelay,
		removeReplayItem,
		setEditedReplayItemId,
		setEditReplayItemMode,
		editedReplayItemId,
		saveEditedReplayItem,
		editReplayItemMode,
		addToReplayList,
		toggleItem,
	} = useReplayStore();
	const { editorStore, schemaType, setSchemaType } = useRootStore();
	const { options } = editorStore;
	const { code, setCode } = useEditorStore();
	const { messageCode, setMessageCode, replacements } = useMessagesStore();

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

		if (!editReplayItemMode) {
			setMessageCode(code);
		}

		setEditedReplayItemId(replayItem.id);
		setCode(replayItem.message);
		setEditReplayItemMode(true);
	};

	const handleSaveReplayItemClicked = () => {
		saveEditedReplayItem();
		setCode(messageCode);
	};

	const saveToReplay = React.useCallback(() => {
		if (schemaType === 'act') {
			const { selectedOptions } = options.act;

			if (selectedOptions) {
				const replayItem: ActReplayItem = {
					selected: false,
					type: 'act',
					id: nanoid(),
					delay: 0,
					message: code,
					result: {
						status: 'ready',
					},
					...selectedOptions,
					replacements: toJS(replacements),
				};

				addToReplayList(replayItem);
			}
		} else {
			const { selectedOptions } = options.parsedMessage;

			if (selectedOptions) {
				const replayItem: ParsedMessageReplayItem = {
					selected: false,
					type: 'parsedMessage',
					id: nanoid(),
					delay: 0,
					message: code,
					result: {
						status: 'ready',
					},
					...selectedOptions,
					replacements: toJS(replacements),
				};

				addToReplayList(replayItem);
			}
		}
	}, [code, options, schemaType, replacements]);

	return (
		<TableBody ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
			<TableRow sx={{ bgcolor: editReplayItemMode ? 'white' : blue[50] }}>
				{schemaType === 'parsedMessage' ? (
					<>
						<TableCell colSpan={4}>New Message</TableCell>
						<SimpleKeyValueCell label='Session' value={options.parsedMessage.selectedSession ?? ''} />
						<SimpleKeyValueCell label='Dictionary' value={options.parsedMessage.selectedDictionary ?? ''} />
						<SimpleKeyValueCell
							label='Message Type'
							value={options.parsedMessage.selectedMessageType ?? ''}
							tableCellProps={{ colSpan: 3 }}
						/>
					</>
				) : (
					<>
						<TableCell colSpan={4}>New gRPC Call</TableCell>
						<SimpleKeyValueCell label='Box' value={options.act.selectedAct ?? ''} />
						<SimpleKeyValueCell label='Service' value={options.act.selectedService ?? ''} />
						<SimpleKeyValueCell
							label='Method'
							value={options.act.selectedMethod?.methodName ?? ''}
							tableCellProps={{ colSpan: 3 }}
						/>
					</>
				)}
				<TableCell>
					{editReplayItemMode && (
						<Tooltip title='Edit item'>
							<IconButton onClick={() => setEditReplayItemMode(false)}>
								<Edit />
							</IconButton>
						</Tooltip>
					)}
					<Tooltip title='Save to replay'>
						<IconButton disabled={!editorStore.currentOptionsStore.selectedOptions} onClick={saveToReplay}>
							<DriveFileMove />
						</IconButton>
					</Tooltip>
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
							toggle={selected => toggleItem(replayItem.id, selected)}
							changeDelay={delay => changeDelay(replayItem.id, delay)}
							save={handleSaveReplayItemClicked}
							edit={() => handleEditCodeClicked(index)}
							remove={() => removeReplayItem(replayItem.id)}
							rename={newName => renameReplayItem(replayItem.id, newName)}
							isReplaying={isReplaying}
						/>
					)}
				</Draggable>
			))}
			{droppableProvided.placeholder}
		</TableBody>
	);
};

export default observer(ReplayTableBody);
