/** ****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the License);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an AS IS BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

import React from 'react';
import { Autocomplete, Chip, IconButton, InputAdornment, Stack, TableCell, TableRow, TextField } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import usePreviewTagsStore from '../../../hooks/usePreviewTagsStore';
import { PreviewAutoComplete } from './PreviewConfigModal';

type Props = {
	configIndex: number;
	autocomplete: PreviewAutoComplete;
};

const PreviewConfigRow = ({ configIndex, autocomplete }: Props) => {
	const [pathInputValue, setPathInputValue] = React.useState('');
	const { modifiedConfig, changeConfig, removeConfig } = usePreviewTagsStore();
	const config = modifiedConfig[configIndex];

	const handleAddPath = React.useCallback(() => {
		if (pathInputValue) {
			changeConfig(configIndex, { paths: [...config.paths, pathInputValue] });
			setPathInputValue('');
		}
	}, [config, pathInputValue, changeConfig, setPathInputValue]);

	const typeAutoComplete = React.useMemo(() => Object.keys(autocomplete), [autocomplete]);

	const subTypeAutoComplete = React.useMemo(
		() => Object.keys(autocomplete[config.type] ?? {}),
		[autocomplete, config.type],
	);

	const pathAutoComplete = React.useMemo(
		() => autocomplete[config.type]?.[config.subType] ?? [],
		[autocomplete, config.type, config.subType],
	);

	const isValid =
		modifiedConfig.findIndex(({ type, subType }) => type === config.type && subType === config.subType) ===
		configIndex;

	return (
		<TableRow>
			<TableCell>
				<Autocomplete
					fullWidth
					autoHighlight
					freeSolo
					value={config.type}
					inputValue={config.type}
					onInputChange={(_, newValue) => changeConfig(configIndex, { type: newValue })}
					renderInput={params => (
						<TextField
							{...params}
							size='small'
							variant='standard'
							label='Dictionary or Service'
							error={!isValid}
							helperText={!isValid && 'A config with these type and sub-type already exists'}
						/>
					)}
					options={typeAutoComplete}
					sx={{ minWidth: 200 }}
				/>
			</TableCell>
			<TableCell>
				<Autocomplete
					fullWidth
					autoHighlight
					freeSolo
					value={config.subType}
					inputValue={config.subType}
					onInputChange={(_, newValue) => changeConfig(configIndex, { subType: newValue })}
					renderInput={params => (
						<TextField
							{...params}
							size='small'
							variant='standard'
							label='Msg Type or Method'
							error={!isValid}
						/>
					)}
					options={subTypeAutoComplete}
					sx={{ minWidth: 200 }}
				/>
			</TableCell>
			<TableCell>
				<Stack direction='row' alignItems='center' spacing={1}>
					{config.paths.map((path, index) => (
						<Chip
							key={path}
							label={path}
							onDelete={() =>
								changeConfig(configIndex, {
									paths: config.paths.filter((_, pathIndex) => pathIndex !== index),
								})
							}
						/>
					))}
					{config.paths.length < 3 && (
						<Autocomplete
							autoHighlight
							freeSolo
							value={pathInputValue}
							inputValue={pathInputValue}
							onInputChange={(_, newValue) => setPathInputValue(newValue)}
							renderInput={params => (
								<TextField
									{...params}
									size='small'
									variant='standard'
									label='Path'
									InputProps={{
										...params.InputProps,
										endAdornment: (
											<InputAdornment position='end'>
												<IconButton onClick={handleAddPath} color='primary'>
													<Add fontSize='small' />
												</IconButton>
											</InputAdornment>
										),
									}}
								/>
							)}
							options={pathAutoComplete}
							sx={{ minWidth: 400 }}
						/>
					)}
				</Stack>
			</TableCell>
			<TableCell>
				<IconButton color='error' onClick={() => removeConfig(configIndex)}>
					<Remove />
				</IconButton>
			</TableCell>
		</TableRow>
	);
};

export default observer(PreviewConfigRow);
