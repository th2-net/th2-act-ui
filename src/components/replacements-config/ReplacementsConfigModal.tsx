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

import React from 'react';
import {
	Autocomplete,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import jsm from 'json-source-map';
import { toJS } from 'mobx';
import useReplayStore from '../../hooks/useReplayStore';
import useReplacementsConfigStore from '../../hooks/useReplacementsConfigStore';
import useMessagesStore from '../../hooks/useMessagesStore';
import useEditorStore from '../../hooks/useEditorStore';

type Props = {
	open: boolean;
	onClose: () => void;
};

const ReplacementsConfigModal = ({ open, onClose }: Props) => {
	const { replayList, editedReplayItemId, changeReplacements, editReplayItemMode, replayItemToEdit } =
		useReplayStore();
	const { replacementsConfig, importConfig, changeConfig, addConfig, deleteConfig } = useReplacementsConfigStore();
	const { replacements, setReplacements } = useMessagesStore();
	const { code } = useEditorStore();

	React.useEffect(() => {
		if (open) {
			if (replayItemToEdit) {
				importConfig(toJS(replayItemToEdit.replacements));
			} else {
				importConfig(toJS(replacements));
			}
		}
	}, [editReplayItemMode, open]);

	const currentMessage = React.useMemo(
		() => replayItemToEdit?.message ?? code,
		[replayList, editReplayItemMode, editedReplayItemId, code],
	);

	const autoCompleteDestinationPaths = React.useMemo(() => {
		try {
			return Object.keys(jsm.parse(currentMessage).pointers).map(x => x || '/');
		} catch {
			return [];
		}
	}, [currentMessage]);

	const replayResultsPaths = React.useMemo(() => {
		let paths: string[] = [];

		replayList.forEach((replayItem, index) => {
			paths.push(`/${index}`);

			if (replayItem.status.response?.code === 200) {
				const resultPaths = Object.keys(jsm.parse(replayItem.status.response.message).pointers)
					.filter(x => x)
					.map(x => `/${index}${x}`);

				paths = [...paths, ...resultPaths];
			}
		});

		return paths;
	}, [replayList]);

	const handleSave = React.useCallback(() => {
		if (editReplayItemMode && editedReplayItemId) {
			changeReplacements(editedReplayItemId, toJS(replacementsConfig));
		} else {
			setReplacements(toJS(replacementsConfig));
		}
		onClose();
	}, [changeReplacements, onClose, replacementsConfig]);

	return (
		<Dialog open={open} onClose={onClose} maxWidth='lg'>
			<DialogTitle>Replacements Config</DialogTitle>
			<DialogContent>
				<Table size='small'>
					<TableHead>
						<TableRow>
							<TableCell>Replace field</TableCell>
							<TableCell>Replace with</TableCell>
							<TableCell />
						</TableRow>
					</TableHead>
					<TableBody>
						{replacementsConfig.map(({ sourcePath, destinationPath }, configIndex) => (
							<TableRow key={`${sourcePath}-${destinationPath}-${configIndex}`}>
								<TableCell>
									<Autocomplete
										autoSelect
										value={destinationPath}
										onChange={(_, newValue: string | null) =>
											changeConfig(configIndex, { destinationPath: newValue || '/' })
										}
										renderInput={params => (
											<TextField
												{...params}
												size='small'
												variant='standard'
												sx={{ minWidth: 300 }}
											/>
										)}
										options={autoCompleteDestinationPaths}
									/>
								</TableCell>
								<TableCell>
									<Autocomplete
										autoSelect
										value={sourcePath}
										onChange={(_, newValue: string | null) =>
											changeConfig(configIndex, { sourcePath: newValue || '/' })
										}
										renderInput={params => (
											<TextField
												{...params}
												size='small'
												variant='standard'
												sx={{ minWidth: 300 }}
											/>
										)}
										options={replayResultsPaths}
									/>
								</TableCell>
								<TableCell>
									<IconButton color='error' onClick={() => deleteConfig(configIndex)}>
										<Remove />
									</IconButton>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				<Button startIcon={<Add />} onClick={() => addConfig({ destinationPath: '/', sourcePath: '/' })}>
					Add
				</Button>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} color='secondary'>
					Cancel
				</Button>
				<Button onClick={handleSave}>Save</Button>
			</DialogActions>
		</Dialog>
	);
};

export default observer(ReplacementsConfigModal);
