import { useRootStore } from './useRootStore';

const useEditorStore = () => useRootStore().editorStore;

export default useEditorStore;
