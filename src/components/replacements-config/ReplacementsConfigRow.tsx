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
import { Autocomplete, IconButton, TableCell, TableRow, TextField } from '@mui/material';
import { Remove } from '@mui/icons-material';
import useReplacementsConfigStore from '../../hooks/useReplacementsConfigStore';
import Value from '../util/Value';
import useReplayStore from '../../hooks/useReplayStore';
import getValueFromReplayListByJSMPath from '../../helpers/getValueFromReplayListByJSMPath';
import getValueBySimpleExpression from '../../helpers/getValueBySimpleExpression';
import FullContentPopper from '../util/FullContentPopper';

type Props = {
	sourcePath: string;
	destinationPath: string;
	configIndex: number;
	destinationPaths: string[];
	replayPaths: string[];
};

const ReplacementsConfigRow = ({ sourcePath, destinationPath, configIndex, destinationPaths, replayPaths }: Props) => {
	const { replayList } = useReplayStore();
	const { changeConfig, deleteConfig } = useReplacementsConfigStore();

	const currentValue = React.useMemo(() => {
		if (sourcePath.startsWith('$')) {
			return getValueBySimpleExpression(sourcePath);
		}

		try {
			return getValueFromReplayListByJSMPath(replayList, sourcePath);
		} catch {
			return undefined;
		}
	}, [replayList, sourcePath]);

	return (
		<TableRow>
			<TableCell>
				<Autocomplete
					autoHighlight
					freeSolo
					value={destinationPath}
					inputValue={destinationPath}
					onInputChange={(_, newValue) => changeConfig(configIndex, { destinationPath: newValue })}
					renderInput={params => <TextField {...params} size='small' variant='standard' />}
					options={destinationPaths}
					PopperComponent={FullContentPopper}
				/>
			</TableCell>
			<TableCell>
				<Autocomplete
					autoHighlight
					freeSolo
					value={sourcePath}
					inputValue={sourcePath}
					onInputChange={(_, newValue) => changeConfig(configIndex, { sourcePath: newValue })}
					renderInput={params => <TextField {...params} size='small' variant='standard' />}
					options={replayPaths}
					PopperComponent={FullContentPopper}
				/>
			</TableCell>
			<TableCell>
				<Value value={currentValue} />
			</TableCell>
			<TableCell>
				<IconButton color='error' onClick={() => deleteConfig(configIndex)}>
					<Remove />
				</IconButton>
			</TableCell>
		</TableRow>
	);
};

export default ReplacementsConfigRow;
