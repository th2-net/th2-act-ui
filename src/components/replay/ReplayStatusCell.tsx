import React from 'react';
import { Box, IconButton, Popover, TableCell } from '@mui/material';
import { blue, green, red, yellow } from '@mui/material/colors';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { ReplayItem, ReplayStatus } from '../../models/Message';
import Result from '../result/Result';

type Props = {
	status: ReplayItem['status'];
};

const colors: Record<ReplayStatus, string> = {
	ready: blue[500],
	edited: yellow[500],
	success: green[500],
	fail: red[500],
};

const ReplayStatusCell = ({ status }: Props) => {
	const [showResult, toggleResult] = React.useState(false);
	const anchorRef = React.useRef<HTMLButtonElement | null>(null);

	return (
		<TableCell sx={{ color: colors[status.type] }}>
			{status.type.toUpperCase()}
			{status.response && (
				<IconButton ref={anchorRef} onClick={() => toggleResult(!showResult)}>
					{showResult ? <VisibilityOff /> : <Visibility />}
				</IconButton>
			)}
			<Popover
				open={showResult}
				onClose={() => toggleResult(false)}
				anchorEl={anchorRef.current}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
				<Box sx={{ width: 500, height: 250 }} className='scrollbar'>
					<Result response={status.response} />
				</Box>
			</Popover>
		</TableCell>
	);
};

export default ReplayStatusCell;
