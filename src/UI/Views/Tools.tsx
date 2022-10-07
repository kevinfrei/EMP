import { Expandable } from '@freik/web-utils';
import { TranscoderConfiguration } from './Tools/Transcoder';

import './styles/Tools.css';

export function ToolsView(): JSX.Element {
  return (
    <div className="tools-view">
      <Expandable separator label="Transcoder" defaultShow>
        <TranscoderConfiguration />
      </Expandable>
    </div>
  );
}
