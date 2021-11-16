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
import { Box, TableCell, TableCellProps, Typography } from '@mui/material';

type Props = {
	label: string;
	value: string;
	tableCellProps?: TableCellProps;
};

const SimpleKeyValueCell = ({ label, value, tableCellProps }: Props) => (
	<TableCell {...tableCellProps}>
		<Box display='flex' flexDirection='column'>
			<Typography color='textSecondary' variant='caption'>
				{label}
			</Typography>
			<Typography variant='body2'>{value}</Typography>
		</Box>
	</TableCell>
);

export default SimpleKeyValueCell;