import { useStore } from './useStore';

const useMessagesHistoryStore = () => {
	const { messageHistoryStore } = useStore();

	return messageHistoryStore;
};

export default useMessagesHistoryStore;
