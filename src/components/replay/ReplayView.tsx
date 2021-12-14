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
import { Box, Button, Stack } from '@mui/material';
import { CheckBox, CheckBoxOutlineBlank, ClearAll, Download, Settings, Upload } from '@mui/icons-material';
import ReplayTable from './ReplayTable';
import useReplayStore from '../../hooks/useReplayStore';
import PreviewConfigModal from './preview-config/PreviewConfigModal';

const ReplayView = () => {
	const { exportReplayList, clearSelected, importFromJSON, selectedItems, allItemsSelected, toggleAll, replayList } =
		useReplayStore();
	const [showPreviewConfigModal, togglePreviewConfigModal] = React.useState(false);

	const loadFromFile = (file: FileList | null) => {
		if (file) {
			const reader = new FileReader();
			reader.readAsText(file.item(0) as Blob);
			reader.onload = () => {
				if (typeof reader.result === 'string') {
					importFromJSON(reader.result);
				}
			};
		}
	};

	return (
		<Box display='grid' gridTemplateRows='1fr auto' height='100%'>
			<ReplayTable />
			<Stack direction='row' spacing={1} p={1}>
				{allItemsSelected ? (
					<Button
						variant='outlined'
						size='small'
						startIcon={<CheckBox />}
						onClick={() => toggleAll(false)}
						disabled={replayList.length === 0}>
						Unselect all
					</Button>
				) : (
					<Button
						variant='outlined'
						size='small'
						startIcon={<CheckBoxOutlineBlank />}
						onClick={() => toggleAll(true)}
						disabled={replayList.length === 0}>
						Select all
					</Button>
				)}
				<Button
					variant='outlined'
					size='small'
					startIcon={<ClearAll />}
					onClick={clearSelected}
					disabled={selectedItems.length === 0}>
					Clear ({selectedItems.length})
				</Button>
				<Button variant='outlined' size='small' startIcon={<Upload />} onClick={exportReplayList}>
					Export
				</Button>
				<Button variant='outlined' component='label' size='small' startIcon={<Download />}>
					Import
					<input type='file' accept='application/json' hidden onChange={e => loadFromFile(e.target.files)} />
				</Button>
				<Button
					variant='outlined'
					size='small'
					startIcon={<Settings />}
					onClick={() => togglePreviewConfigModal(true)}>
					Preview Config
				</Button>
			</Stack>
			<PreviewConfigModal open={showPreviewConfigModal} onClose={() => togglePreviewConfigModal(false)} />
		</Box>
	);
};

export default ReplayView;
