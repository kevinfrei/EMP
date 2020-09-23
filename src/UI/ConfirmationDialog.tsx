// eslint-disable-next-line @typescript-eslint/no-use-before-define
import React from 'react';
import {
  DefaultButton,
  Dialog,
  PrimaryButton,
  Stack,
  Text,
} from '@fluentui/react';

export default function ConfirmationDialog({
  hidden,
  hide,
  confirmFunc,
  title,
  text,
  confirm,
  cancel,
  minWidth,
  maxWidth,
}: {
  hidden: boolean;
  hide: () => void;
  confirmFunc: () => void;
  title: string;
  text: string;
  confirm: string;
  cancel: string;
  minWidth?: number;
  maxWidth?: number;
}): JSX.Element {
  return (
    <Dialog
      title={title}
      maxWidth={maxWidth}
      minWidth={minWidth}
      hidden={hidden}
      onDismiss={hide}
    >
      <Stack>
        <Text>{text}</Text>
        <br />
        <div>
          <DefaultButton
            style={{ float: 'left' }}
            onClick={() => {
              hide();
              confirmFunc();
            }}
          >
            {confirm}
          </DefaultButton>
          <PrimaryButton style={{ float: 'right' }} onClick={hide}>
            {cancel}
          </PrimaryButton>
        </div>
      </Stack>
    </Dialog>
  );
}
