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
import { blue, red } from '@mui/material/colors';
import {
	Badge,
	Checkbox,
	IconButton,
	InputAdornment,
	Stack,
	TableCell,
	TableRow,
	TextField,
	Tooltip,
} from '@mui/material';
import { Code, DeleteOutline, Edit, ReorderRounded, Save } from '@mui/icons-material';
import { DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import {
	ActReplayItem,
	isActReplayItem,
	isParsedMessageReplayItem,
	ParsedMessageReplayItem,
} from '../../models/Message';
import ReplayStatusCell from './ReplayStatusCell';
import SimpleKeyValueCell from './SimpleKeyValueCell';
import ReplayPreviewCell from './ReplayPreviewCell';

type Props = {
	draggableProvided: DraggableProvided;
	snapshot: DraggableStateSnapshot;
	isEditing: boolean;
	replayItem: ParsedMessageReplayItem | ActReplayItem;
	toggle: (selected: boolean) => void;
	changeDelay: (delay: number) => void;
	save: () => void;
	edit: () => void;
	remove: () => void;
	rename: (newName: string) => void;
};

const ReplayTableRow = ({
	draggableProvided,
	snapshot,
	isEditing,
	replayItem,
	toggle,
	changeDelay,
	save,
	edit,
	remove,
	rename,
}: Props) => (
	<TableRow
		ref={draggableProvided.innerRef}
		{...draggableProvided.draggableProps}
		sx={{
			opacity: snapshot.isDragging ? '0.80' : '1',
			bgcolor: isEditing ? blue[50] : 'white',
		}}>
		<TableCell sx={{ pr: 0 }}>
			<Checkbox size='small' checked={replayItem.selected} onClick={() => toggle(!replayItem.selected)} />
		</TableCell>
		<TableCell>
			<div {...draggableProvided.dragHandleProps}>
				<ReorderRounded />
			</div>
		</TableCell>
		<TableCell>
			<Stack direction='row' spacing={1} alignItems='center'>
				<TextField
					placeholder='Untitled'
					value={replayItem.name ?? ''}
					onChange={e => rename(e.target.value)}
					onFocus={e => e.target.select()}
					size='small'
					variant='standard'
					sx={{ minWidth: 90 }}
				/>
				{replayItem.replacements.length > 0 && (
					<Tooltip title='Some fields will be modified by expressions'>
						<Badge variant='dot' color='info'>
							<Code color='primary' fontSize='small' />
						</Badge>
					</Tooltip>
				)}
			</Stack>
		</TableCell>
		<ReplayPreviewCell replayItem={replayItem} />
		{isActReplayItem(replayItem) && (
			<>
				<SimpleKeyValueCell label='Box' value={replayItem.actBox} />
				<SimpleKeyValueCell label='Service' value={replayItem.fullServiceName} />
				<SimpleKeyValueCell label='Method' value={replayItem.methodName} />
			</>
		)}
		{isParsedMessageReplayItem(replayItem) && (
			<>
				<SimpleKeyValueCell label='Session' value={replayItem.session} />
				<SimpleKeyValueCell label='Dictionary' value={replayItem.dictionary} />
				<SimpleKeyValueCell label='Message Type' value={replayItem.messageType} />
			</>
		)}
		<TableCell>
			<TextField
				label='Delay'
				value={replayItem.delay}
				onChange={e => changeDelay(parseInt(e.target.value))}
				onFocus={e => e.target.select()}
				size='small'
				type='number'
				variant='standard'
				sx={{ minWidth: 90 }}
				InputProps={{
					endAdornment: <InputAdornment position='end'>ms</InputAdornment>,
				}}
			/>
		</TableCell>
		<ReplayStatusCell result={replayItem.result} />
		<TableCell sx={{ whiteSpace: 'nowrap' }}>
			{isEditing ? (
				<Tooltip title='Save'>
					<IconButton onClick={save}>
						<Save />
					</IconButton>
				</Tooltip>
			) : (
				<Tooltip title='Edit message'>
					<IconButton onClick={edit}>
						<Edit />
					</IconButton>
				</Tooltip>
			)}
			<Tooltip title='Remove'>
				<IconButton onClick={remove}>
					<DeleteOutline sx={{ color: red[500] }} />
				</IconButton>
			</Tooltip>
		</TableCell>
	</TableRow>
);

export default ReplayTableRow;
