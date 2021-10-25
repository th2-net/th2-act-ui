import useMessagesStore from './useMessagesStore';

const useMessageHistoryStore = () => useMessagesStore().historyStore;

export default useMessageHistoryStore;
