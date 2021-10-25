import React from 'react';
import { Box, Button } from '@mui/material';
import { ClearAll, Download, Upload } from '@mui/icons-material';
import ReplayTable from './ReplayTable';
import useMessageHistoryStore from '../../hooks/useMessageHistoryStore';

const ReplayView = () => {
	const { exportReplayList, clearReplayList, clearUntitled, importFromJSON } = useMessageHistoryStore();

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
		<Box sx={{ display: 'grid', gridTemplateRows: '1fr auto', height: '100%' }}>
			<ReplayTable />
			<Box sx={{ display: 'flex', gap: 1, p: 1 }}>
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
			</Box>
		</Box>
	);
};

export default ReplayView;
