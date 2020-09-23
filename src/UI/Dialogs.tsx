// eslint-disable-next-line @typescript-eslint/no-use-before-define
import {
  DefaultButton,
  Dialog,
  PrimaryButton,
  Stack,
  Text,
  TextField,
} from '@fluentui/react';
import React, { useState } from 'react';

export type TextInputDialogProps = {
  hidden: boolean;
  hide: () => void;
  confirmFunc: (value: string) => void;
  title: string;
  text: string;
  initialValue: string;
  yesText?: string;
  noText?: string;
  minWidth?: number;
  maxWidth?: number;
};

export function TextInputDialog({
  hidden,
  hide,
  confirmFunc,
  title,
  text,
  initialValue,
  yesText,
  noText,
  minWidth,
  maxWidth,
}: TextInputDialogProps): JSX.Element {
  const [input, setInput] = useState(initialValue);
  const confirmAndClose = () => {
    hide();
    confirmFunc(input);
  };
  const yes = yesText ?? 'Yes';
  const no = noText ?? 'No';
  return (
    <Dialog
      title={title}
      hidden={hidden}
      onDismiss={hide}
      minWidth={minWidth}
      maxWidth={maxWidth}
    >
      <Stack>
        <Text>{text}</Text>
        <TextField
          value={input}
          onChange={(ev, newValue) => setInput(newValue ?? initialValue)}
        />
        <br />
        <div>
          <PrimaryButton style={{ float: 'left' }} onClick={hide}>
            {no}
          </PrimaryButton>
          <DefaultButton style={{ float: 'right' }} onClick={confirmAndClose}>
            {yes}
          </DefaultButton>
        </div>
      </Stack>
    </Dialog>
  );
}

export type ConfirmationDialogProps = {
  hidden: boolean;
  hide: () => void;
  confirmFunc: () => void;
  title: string;
  text: string;
  yesText?: string;
  noText?: string;
  minWidth?: number;
  maxWidth?: number;
};

export function ConfirmationDialog({
  hidden,
  hide,
  confirmFunc,
  title,
  text,
  yesText,
  noText,
  minWidth,
  maxWidth,
}: ConfirmationDialogProps): JSX.Element {
  const yes = yesText ?? 'Yes';
  const no = noText ?? 'No';
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
            {yes}
          </DefaultButton>
          <PrimaryButton style={{ float: 'right' }} onClick={hide}>
            {no}
          </PrimaryButton>
        </div>
      </Stack>
    </Dialog>
  );
}
