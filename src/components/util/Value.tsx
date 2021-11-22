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
import { IconButton, Popover, Stack, Typography } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Editor from '@monaco-editor/react';

type Props = {
	value: unknown;
};

const Value = ({ value }: Props) => {
	const [showEditor, toggleShowEditor] = React.useState(false);
	const anchorRef = React.useRef<HTMLButtonElement | null>(null);

	let stringValue: string;
	let isObject = false;

	if (value === undefined) {
		stringValue = 'No Value';
	} else if (typeof value === 'string') {
		stringValue = `"${value}"`;
	} else if (typeof value === 'object' && value !== null) {
		stringValue = JSON.stringify(value);
		isObject = true;
	} else {
		stringValue = String(value);
	}

	if (!isObject) return <Typography>{stringValue}</Typography>;

	return (
		<Stack direction='row' alignItems='center'>
			<Typography>Object</Typography>
			<IconButton ref={anchorRef} onClick={() => toggleShowEditor(!showEditor)}>
				{showEditor ? <VisibilityOff /> : <Visibility />}
			</IconButton>
			<Popover
				anchorEl={anchorRef.current}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				open={showEditor}
				onClose={() => toggleShowEditor(false)}
				PaperProps={{ sx: { width: 500, height: 250, overflow: 'hidden' } }}>
				<Editor
					value={JSON.stringify(value, null, '    ')}
					language='json'
					options={{
						minimap: { enabled: false },
						readOnly: true,
						lineNumbers: 'off',
						wordWrap: 'on',
						automaticLayout: true,
					}}
					path='/value'
				/>
			</Popover>
		</Stack>
	);
};

export default Value;
