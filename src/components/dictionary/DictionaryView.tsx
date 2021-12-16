/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

import React, { useEffect } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import Editor from '@monaco-editor/react';
import { observer } from 'mobx-react-lite';
import { grey, red } from '@mui/material/colors';
import useDictionaryStore from '../../hooks/useDictionaryStore';
import useSchema from '../../hooks/useSchema';
import useEditorStore from '../../hooks/useEditorStore';

const DictionaryView = () => {
	const { options } = useEditorStore();
	const dictionaryStore = useDictionaryStore();
	const schema = useSchema() || 'hand';
	const { dictionary, isLoadingDictionary, isSavingDictionary, setDictionaryCode, isDictionaryCodeValid } =
		dictionaryStore;
	const { selectedDictionary } = options.parsedMessage;

	useEffect(() => {
		if (schema && selectedDictionary) {
			dictionaryStore.fetchDictionary(schema, selectedDictionary);
		}
	}, [schema, selectedDictionary]);

	if (!schema)
		return (
			<Box pt={1} pl={2}>
				<Typography sx={{ color: grey[700] }}>Please provide a schema to url</Typography>
			</Box>
		);

	if (!selectedDictionary)
		return (
			<Box pt={1} pl={2}>
				<Typography sx={{ color: grey[700] }}>Please select a dictionary</Typography>
			</Box>
		);

	if (isLoadingDictionary)
		return (
			<Box display='flex' alignItems='center' justifyContent='center' height='100%'>
				<CircularProgress />
			</Box>
		);

	return (
		<Box display='grid' gridTemplateRows='1fr auto' height='100%'>
			<Box sx={{ border: `1px solid ${isDictionaryCodeValid ? 'transparent' : red[500]}` }}>
				{dictionary && (
					<Editor
						language='xml'
						value={dictionary.spec.data}
						onChange={newValue => setDictionaryCode(newValue ?? '')}
						options={{ automaticLayout: true, fontSize: 12 }}
					/>
				)}
			</Box>
			<Box p={1}>
				<Button
					size='small'
					variant='outlined'
					onClick={() => dictionaryStore.saveDictionary(schema)}
					endIcon={isSavingDictionary && <CircularProgress size={14} />}
					disabled={isSavingDictionary || !isDictionaryCodeValid}>
					Apply changes
				</Button>
			</Box>
		</Box>
	);
};

export default observer(DictionaryView);
