import { Stack, Text } from '@fluentui/react';
import { Expandable } from '@freik/web-utils';
import { useRecoilValue } from 'recoil';
import { TranscodeState } from 'shared';
import { transcodeStatusState } from '../../../Recoil/TranscodeState';

function completed(xcs: TranscodeState): number {
  return (
    xcs.filesTranscoded.length +
    xcs.filesUntouched +
    (xcs.filesFailed ? xcs.filesFailed.length : 0)
  );
}

function remaining(xcs: TranscodeState): number {
  return xcs.filesFound - completed(xcs);
}

type XcodeSum = { complete: number; pending: number; status: string };

export function TranscodeSummary({
  complete,
  pending,
  status,
}: XcodeSum): JSX.Element {
  if (complete === 0 && pending === 0) {
    return <span>{status}</span>;
  } else {
    return (
      <span>
        {status} About {(100.0 * (complete / (complete + pending))).toFixed(2)}%
        complete
      </span>
    );
  }
}

function CountedStringList({
  list,
  header,
}: {
  list?: string[];
  header: string;
}) {
  return list ? (
    <Expandable label={`${list.length} ${header}`} indent={15}>
      {list.map((val, idx) => (
        <div key={idx}>
          <Text>{val}</Text>
          <br />
        </div>
      ))}
    </Expandable>
  ) : (
    <></>
  );
}

export function TranscodeStatus(): JSX.Element {
  const curState = useRecoilValue(transcodeStatusState);
  const complete = completed(curState);
  const pending = remaining(curState);
  const summary = (
    <TranscodeSummary
      complete={complete}
      pending={pending}
      status={curState.curStatus}
    />
  );
  const errorList = curState.filesFailed ? (
    <Expandable
      label={`${curState.filesFailed.length} files failed`}
      indent={15}
    >
      {curState.filesFailed.map(({ file, error }, idx) => (
        <div key={idx} style={{ margin: 10 }}>
          <Stack horizontal>
            <Text>{file}:</Text>
            <Text>{error}</Text>
          </Stack>
        </div>
      ))}
    </Expandable>
  ) : (
    <></>
  );
  return (
    <Expandable label={summary} indent={15}>
      <Stack>
        <Text>{curState.filesFound} total files to process</Text>
        <Text>{curState.filesPending} files remain to be processed</Text>
        <Text>{complete} files completed</Text>
        <Expandable label="Details" indent={30}>
          <Text>{curState.filesUntouched} files already existed</Text>
          <CountedStringList
            list={curState.filesTranscoded}
            header="files transcoded"
          />
          <CountedStringList
            list={curState.itemsRemoved}
            header="items deleted"
          />
          {errorList}
        </Expandable>
      </Stack>
    </Expandable>
  );
}
