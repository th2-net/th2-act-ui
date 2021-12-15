/* eslint-disable @typescript-eslint/no-non-null-assertion */
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
import { Box, SxProps } from '@mui/material';
import { grey } from '@mui/material/colors';
import { MoreVert, MoreHoriz } from '@mui/icons-material';
import ResizeObserver from 'resize-observer-polyfill';

type Props = {
	children: [React.ReactNode, React.ReactNode];
	vertical?: boolean;
	splitterStepPercents?: number;
	zIndex?: number;
	defaultPanelArea?: number;
};

const splitterThickness = 15;

const SplitView = ({ children, vertical, splitterStepPercents = 5, defaultPanelArea = 50 }: Props) => {
	const [firstPanelArea, setFirstPanelArea] = React.useState(defaultPanelArea);
	const [firstPreviewPanelArea, setFirstPreviewPanelArea] = React.useState(defaultPanelArea);
	const [isDragging, setIsDragging] = React.useState(false);
	const [rootSize, setRootSize] = React.useState(0);
	const rootRef = React.useRef<HTMLDivElement | null>(null);
	const splitterRef = React.useRef<HTMLDivElement | null>(null);

	React.useEffect(() => {
		let dispose: () => void = () => undefined;

		if (rootRef.current) {
			const root = rootRef.current;
			const resizeObserver = new ResizeObserver(entries => {
				setRootSize(vertical ? entries[0].contentRect.height : entries[0].contentRect.width);
			});

			resizeObserver.observe(root);
			dispose = () => resizeObserver.unobserve(root);
		}

		return dispose;
	}, [setRootSize, vertical]);

	const availableSize = rootSize - splitterThickness;
	const firstPreviewPanelSize = (availableSize / 100) * firstPreviewPanelArea;
	const firstPanelSize = (availableSize / 100) * firstPanelArea;

	React.useEffect(() => {
		let dispose: () => void = () => undefined;

		if (isDragging && rootRef.current) {
			const root = rootRef.current;
			const onMouseUp = () => {
				setIsDragging(false);
				setFirstPanelArea(firstPreviewPanelArea);
			};

			const onMouseMove = (e: MouseEvent) => {
				e.preventDefault();
				let newFirstPreviewPanelSize = vertical
					? e.clientY - root.getBoundingClientRect().top
					: e.clientX - root.getBoundingClientRect().left;
				newFirstPreviewPanelSize -= splitterThickness / 2;
				newFirstPreviewPanelSize = Math.max(newFirstPreviewPanelSize, 0);
				newFirstPreviewPanelSize = Math.min(newFirstPreviewPanelSize, availableSize);
				setFirstPreviewPanelArea(
					Math.round(((newFirstPreviewPanelSize / availableSize) * 100) / splitterStepPercents) *
						splitterStepPercents,
				);
			};

			document.addEventListener('mouseup', onMouseUp);
			document.addEventListener('mousemove', onMouseMove);

			dispose = () => {
				document.removeEventListener('mouseup', onMouseUp);
				document.removeEventListener('mousemove', onMouseMove);
			};
		} else if (splitterRef.current) {
			const splitter = splitterRef.current;
			const onMouseDown = () => {
				setIsDragging(true);
			};

			splitter.addEventListener('mousedown', onMouseDown);

			dispose = () => {
				splitter.removeEventListener('mousedown', onMouseDown);
			};
		}

		return dispose;
	}, [
		isDragging,
		setIsDragging,
		availableSize,
		vertical,
		setFirstPreviewPanelArea,
		splitterStepPercents,
		firstPreviewPanelArea,
		setFirstPanelArea,
	]);

	const panelsGridTemplate = isDragging
		? {
				[vertical ? 'gridTemplateRows' : 'gridTemplateColumns']: `${firstPanelSize}px 1fr`,
				gridTemplateAreas: vertical ? '"firstPanel" "secondPanel"' : '"firstPanel secondPanel"',
		  }
		: {
				[vertical
					? 'gridTemplateRows'
					: 'gridTemplateColumns']: `${firstPanelSize}px ${splitterThickness}px 1fr`,
				gridTemplateAreas: vertical
					? '"firstPanel" "splitter" "secondPanel"'
					: '"firstPanel splitter secondPanel"',
		  };

	const splitterSxProps: SxProps | undefined = isDragging
		? {
				position: 'absolute',
				top: vertical ? firstPreviewPanelSize : 0,
				left: vertical ? 0 : firstPreviewPanelSize,
				width: vertical ? '100%' : splitterThickness,
				height: vertical ? splitterThickness : '100%',
		  }
		: {
				gridArea: 'splitter',
		  };

	const firstPreviewPanelProps: SxProps | undefined = isDragging
		? {
				position: 'absolute',
				top: 0,
				left: 0,
				width: vertical ? '100%' : firstPreviewPanelSize,
				height: vertical ? firstPreviewPanelSize : '100%',
				bgcolor: `${grey[900]}1a`,
		  }
		: undefined;

	const secondPreviewPanelProps: SxProps | undefined = isDragging
		? {
				position: 'absolute',
				top: vertical ? firstPreviewPanelSize + splitterThickness : 0,
				left: vertical ? 0 : firstPreviewPanelSize + splitterThickness,
				width: vertical ? '100%' : availableSize - firstPreviewPanelSize,
				height: vertical ? availableSize - firstPreviewPanelSize : '100%',
				bgcolor: `${grey[900]}1a`,
		  }
		: undefined;

	return (
		<Box ref={rootRef} height='100%' position='relative'>
			<Box display='grid' {...panelsGridTemplate} gap={`${isDragging ? splitterThickness : 0}px`} height='100%'>
				<Box overflow='hidden' gridArea='firstPanel'>
					{children[0]}
				</Box>
				<Box overflow='hidden' gridArea='secondPanel'>
					{children[1]}
				</Box>
				{isDragging && (
					<>
						<Box sx={firstPreviewPanelProps} style={{ cursor: vertical ? 'row-resize' : 'col-resize' }} />
						<Box sx={secondPreviewPanelProps} style={{ cursor: vertical ? 'row-resize' : 'col-resize' }} />
					</>
				)}
				<Box
					ref={splitterRef}
					height='100%'
					display='flex'
					justifyContent='center'
					alignItems='center'
					overflow='hidden'
					sx={splitterSxProps}
					style={{ cursor: vertical ? 'row-resize' : 'col-resize' }}>
					{vertical ? <MoreHoriz sx={{ color: grey[500] }} /> : <MoreVert sx={{ color: grey[500] }} />}
				</Box>
			</Box>
		</Box>
	);
};

export default SplitView;
