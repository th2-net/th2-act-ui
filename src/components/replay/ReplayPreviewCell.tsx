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
import { observer } from 'mobx-react-lite';
import jp from 'jsonpath';
import { Stack, TableCell, Tooltip, Typography } from '@mui/material';
import { blue } from '@mui/material/colors';
import usePreviewTagsStore from '../../hooks/usePreviewTagsStore';
import { isActReplayItem, isParsedMessageReplayItem, ReplayItem } from '../../models/Message';
import { JSMPathToJsonPath } from '../../helpers/jsonPath';
import isGRPCValueField from '../../helpers/isGRPCValueField';

type Props = {
	replayItem: ReplayItem;
};

const toPrimitiveString = (value: unknown) => {
	if (value === undefined) return 'No Value';
	if (typeof value === 'string') return `"${value}"`;
	if (typeof value === 'object' && value !== null) return 'object';
	return String(value);
};

const ReplayPreviewCell = ({ replayItem }: Props) => {
	const { originalConfig } = usePreviewTagsStore();

	const previewRows = React.useMemo(() => {
		const { type, subType } = isActReplayItem(replayItem)
			? { type: replayItem.fullServiceName, subType: replayItem.methodName }
			: isParsedMessageReplayItem(replayItem)
			? { type: replayItem.dictionary, subType: replayItem.messageType }
			: { type: null, subType: null };

		if (!type || !subType) return null;

		const previewConfig = originalConfig.find(config => config.type === type && config.subType === subType);

		if (!previewConfig) return null;

		let message: string;

		try {
			message = JSON.parse(replayItem.message);
		} catch {
			return null;
		}

		return previewConfig.paths.map(path => {
			const replacementConfig = replayItem.replacements.find(config => config.destinationPath === path);

			const splitPath = path.split('/');
			const key = isGRPCValueField(splitPath.slice(-1)[0]) ? splitPath.slice(-2)[0] : splitPath.slice(-1)[0];

			return {
				key,
				value: replacementConfig
					? replacementConfig.sourcePath
					: toPrimitiveString(jp.value(message, JSMPathToJsonPath(path))),
			};
		});
	}, [replayItem, originalConfig]);

	return (
		<TableCell>
			{previewRows && (
				<Stack maxWidth={250}>
					{previewRows.map(({ key, value }, index) => (
						<Stack direction='row' alignItems='center' spacing={0.5} key={`${key}-${value}-${index}`}>
							<Tooltip title={key}>
								<Typography variant='caption' noWrap>
									{key}:
								</Typography>
							</Tooltip>
							<Tooltip title={value}>
								<Typography variant='caption' color={blue[700]} noWrap>
									{value}
								</Typography>
							</Tooltip>
						</Stack>
					))}
				</Stack>
			)}
		</TableCell>
	);
};

export default observer(ReplayPreviewCell);
