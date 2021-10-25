import { useRootStore } from './useRootStore';

const useMessagesStore = () => useRootStore().currentMessagesStore;

export default useMessagesStore;
