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
import { Box, IconButton, Popover, TableCell } from '@mui/material';
import { blue, green, red, yellow } from '@mui/material/colors';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { ReplayItem, ReplayStatus } from '../../models/Message';
import Result from '../result/Result';

type Props = {
	result: ReplayItem['result'];
};

const colors: Record<ReplayStatus, string> = {
	ready: blue[500],
	edited: yellow[500],
	success: green[500],
	fail: red[500],
};

const ReplayStatusCell = ({ result }: Props) => {
	const [showResult, toggleResult] = React.useState(false);
	const anchorRef = React.useRef<HTMLButtonElement | null>(null);

	return (
		<TableCell sx={{ color: colors[result.status] }}>
			{result.status.toUpperCase()}
			{result.response && (
				<IconButton ref={anchorRef} onClick={() => toggleResult(!showResult)}>
					{showResult ? <VisibilityOff /> : <Visibility />}
				</IconButton>
			)}
			<Popover
				open={showResult}
				onClose={() => toggleResult(false)}
				anchorEl={anchorRef.current}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
				<Box width={800} height={500} className='scrollbar'>
					<Result response={result.response} appliedReplacements={result.appliedReplacements} />
				</Box>
			</Popover>
		</TableCell>
	);
};

export default ReplayStatusCell;
