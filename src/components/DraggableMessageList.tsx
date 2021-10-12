import React from 'react';
import { observer } from 'mobx-react-lite';
import {
	ActMessageHistoryItem,
	MessageHistoryItem,
	ParsedMessageHistoryItem,
} from '../models/Message';
import DraggableMessageItem from './DraggableMessageItem';
import { useStore } from '../hooks/useStore';

const DraggableMessageList = () => {
	const { currentHistoryStore } = useStore();

	return (
		<>
			{(currentHistoryStore.history as MessageHistoryItem[]).map((item, index: number) => (
				<DraggableMessageItem
					key={item.id}
					keyId={item.id}
					index={index}
					message={item as ParsedMessageHistoryItem | ActMessageHistoryItem}
					editMessageMode={currentHistoryStore.editMessageMode}
				/>
			))}
		</>
	);
};

export default observer(DraggableMessageList);
