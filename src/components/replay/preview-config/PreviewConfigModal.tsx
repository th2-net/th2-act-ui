/** ****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the License);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an AS IS BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

import React from 'react';
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { nanoid } from 'nanoid';
import usePreviewTagsStore from '../../../hooks/usePreviewTagsStore';
import PreviewConfigRow from './PreviewConfigRow';
import useEditorStore from '../../../hooks/useEditorStore';
import useReplayStore from '../../../hooks/useReplayStore';
import { isActReplayItem, isParsedMessageReplayItem } from '../../../models/Message';
import getPathsFromJSONString from '../../../helpers/getPathsFromJSONString';
import getUniqueArray from '../../../helpers/getUniqueArray';

export interface PreviewAutoComplete {
	[type: string]: {
		[subType: string]: string[];
	};
}

type Props = {
	open: boolean;
	onClose: () => void;
};

const PreviewConfigModal = ({ open, onClose }: Props) => {
	const { modifiedConfig, saveChanges, cancelChanges, addConfig } = usePreviewTagsStore();
	const { options } = useEditorStore();
	const { replayList } = useReplayStore();

	const previewAutoComplete = React.useMemo(() => {
		const result: PreviewAutoComplete = {};

		options.parsedMessage.dictionaries.forEach(dictionary => (result[dictionary] = {}));
		options.parsedMessage.messageTypes.forEach(msgType => {
			if (options.parsedMessage.selectedDictionary) {
				result[options.parsedMessage.selectedDictionary][msgType] = [];
			}
		});

		options.act.services.forEach(service => (result[service] = {}));
		options.act.serviceDetails?.methods.forEach(method => {
			if (options.act.selectedService) {
				result[options.act.selectedService][method.methodName] = [];
			}
		});

		replayList.forEach(replayItem => {
			const type = isParsedMessageReplayItem(replayItem)
				? replayItem.dictionary
				: isActReplayItem(replayItem)
				? replayItem.fullServiceName
				: '';

			const subType = isParsedMessageReplayItem(replayItem)
				? replayItem.messageType
				: isActReplayItem(replayItem)
				? replayItem.methodName
				: '';

			if (!result[type]) {
				result[type] = {};
			}

			if (!result[type][subType]) {
				result[type][subType] = [];
			}

			result[type][subType] = getUniqueArray([
				...result[type][subType],
				...getPathsFromJSONString(replayItem.message),
			]);
		});

		return result;
	}, [
		replayList,
		options.parsedMessage.dictionaries,
		options.parsedMessage.selectedDictionary,
		options.parsedMessage.messageTypes,
		options.act.services,
		options.act.selectedService,
		options.act.serviceDetails,
	]);

	const handleCancel = React.useCallback(() => {
		cancelChanges();
		onClose();
	}, [cancelChanges, onClose]);

	const handleSave = React.useCallback(() => {
		saveChanges();
		onClose();
	}, [saveChanges, onClose]);

	return (
		<Dialog open={open} onClose={handleCancel} maxWidth='xl' fullWidth>
			<DialogTitle>Preview Config</DialogTitle>
			<DialogContent className='scrollbar'>
				<Table size='small'>
					<TableHead>
						<TableRow>
							<TableCell>Type</TableCell>
							<TableCell>Sub-type</TableCell>
							<TableCell>Paths</TableCell>
							<TableCell />
						</TableRow>
					</TableHead>
					<TableBody>
						{modifiedConfig.map((config, index) => (
							<PreviewConfigRow configIndex={index} autocomplete={previewAutoComplete} key={config.id} />
						))}
					</TableBody>
				</Table>
				<Button
					startIcon={<Add />}
					onClick={() => addConfig({ id: nanoid(), type: '', subType: '', paths: [] })}>
					Add
				</Button>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleCancel} color='secondary'>
					Cancel
				</Button>
				<Button onClick={handleSave}>Save</Button>
			</DialogActions>
		</Dialog>
	);
};

export default observer(PreviewConfigModal);
