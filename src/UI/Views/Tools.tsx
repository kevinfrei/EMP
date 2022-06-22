import { Stack } from '@fluentui/react';
import { Expandable } from '@freik/web-utils';
import './styles/Tools.css';
import { TranscoderConfiguration } from './Tools/Transcoder';

export function ToolsView(): JSX.Element {
  return (
    <Stack className="tools-view">
      <Expandable separator label="Transcoder" defaultShow>
        <TranscoderConfiguration />
      </Expandable>
    </Stack>
  );
}
