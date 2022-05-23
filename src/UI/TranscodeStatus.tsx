import { Stack, Text } from '@fluentui/react';
import { Expandable } from '@freik/web-utils';
import { useRecoilValue } from 'recoil';
import { TranscodeState } from 'shared';
import { transcodeStatusState } from '../Recoil/transcoding';

function completed(xcs: TranscodeState): number {
  return (
    xcs.dirsScanned.length +
    xcs.filesTranscoded.length +
    xcs.filesUntouched +
    (xcs.filesFailed ? xcs.filesFailed.length : 0)
  );
}

function remaining(xcs: TranscodeState): number {
  return xcs.dirsPending.length + xcs.filesPending;
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
        Transcode status: {status}, about{' '}
        {(complete / (complete + pending)) * 100}% complete
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
        <Text key={idx}>{val}</Text>
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
        <Stack key={idx} horizontal>
          <Text>{file}:</Text>
          <Text>{error}</Text>
        </Stack>
      ))}
    </Expandable>
  ) : (
    <></>
  );
  return (
    <Expandable label={summary} indent={15}>
      <Stack>
        <CountedStringList
          list={curState.dirsScanned}
          header="folders scanned"
        />
        <CountedStringList
          list={curState.dirsPending}
          header="folders pending"
        />
        <CountedStringList
          list={curState.filesTranscoded}
          header="files transcoded"
        />
        <Text>{curState.filesPending} files pending</Text>
        <Text>{curState.filesUntouched} files already existed</Text>
        <CountedStringList
          list={curState.itemsRemoved}
          header="items deleted"
        />
        {errorList}
      </Stack>
    </Expandable>
  );
}
