import React from 'react';

type Props = {
	tabIndex: number;
	currentTab: number;
	children: React.ReactNode;
};

const TabPanel = ({ tabIndex, currentTab, children }: Props) =>
	tabIndex === currentTab ? <>{children}</> : null;

export default TabPanel;
