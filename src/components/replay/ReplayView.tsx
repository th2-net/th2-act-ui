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
import { ClearAll, Download, Upload } from '@mui/icons-material';
import ReplayTable from './ReplayTable';
import useReplayStore from '../../hooks/useReplayStore';

const ReplayView = () => {
	const { exportReplayList, clearReplayList, clearUntitled, importFromJSON } = useReplayStore();

	const loadFromFile = (file: FileList | null) => {
		if (file != null) {
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
				<Button variant='outlined' size='small' startIcon={<ClearAll />} onClick={clearReplayList}>
					Clear
				</Button>
				<Button variant='outlined' size='small' startIcon={<ClearAll />} onClick={clearUntitled}>
					Clear untitled
				</Button>
				<Button variant='outlined' size='small' startIcon={<Upload />} onClick={exportReplayList}>
					Export
				</Button>
				<label htmlFor='contained-button-file'>
					<Button variant='outlined' component='label' size='small' startIcon={<Download />}>
						Import
						<input
							type='file'
							accept='application/json'
							hidden
							onChange={e => loadFromFile(e.target.files)}
						/>
					</Button>
				</label>
			</Stack>
		</Box>
	);
};

export default ReplayView;
