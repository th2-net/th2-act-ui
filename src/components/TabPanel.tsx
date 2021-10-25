import React from 'react';
import { Box } from '@mui/material';

type Props = {
	currentTab: number;
	tabIndex: number;
	children: React.ReactNode;
};

const TabPanel = ({ currentTab, tabIndex, children }: Props) =>
	currentTab === tabIndex ? (
		<Box sx={{ height: '100%', bgcolor: 'white', borderRadius: 1, borderTopLeftRadius: 0, overflow: 'hidden' }}>
			{children}
		</Box>
	) : null;

export default TabPanel;
