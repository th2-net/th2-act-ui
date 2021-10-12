import React from 'react';
import { observer } from 'mobx-react-lite';
import { ActMessageItem, MessageItem, ParsedMessageItem } from '../models/Message';
import DraggableMessageItem from './MessageItem';
import { useStore } from '../hooks/useStore';

const DraggableMessageList = () => {
	const { currentHistoryStore: messageListDataStore } = useStore();

	return (
		<>
			{(messageListDataStore.history as MessageItem[]).map((item, index: number) => (
				<DraggableMessageItem
					key={item.id}
					keyId={item.id}
					index={index}
					message={item as ParsedMessageItem | ActMessageItem}
					editMessageMode={messageListDataStore.editMessageMode}
				/>
			))}
		</>
	);
};

export default observer(DraggableMessageList);
