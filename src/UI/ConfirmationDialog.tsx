import React from 'react';
import {
  DefaultButton,
  Dialog,
  PrimaryButton,
  Stack,
  Text,
} from '@fluentui/react';

export default function ConfirmationDialog(
  [visible, setVisible]: [visible: boolean, setVisible: (v: boolean) => void],
  title: string,
  text: string,
  confirmText: string,
  cancelText: string,
  confirmFunc: () => void,
  minWidth?: number,
  maxWidth?: number,
): JSX.Element {
  const hide = () => setVisible(false);
  return (
    <Dialog
      title={title}
      maxWidth={maxWidth}
      minWidth={minWidth}
      hidden={!visible}
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
            {confirmText}
          </DefaultButton>
          <PrimaryButton style={{ float: 'right' }} onClick={hide}>
            {cancelText}
          </PrimaryButton>
        </div>
      </Stack>
    </Dialog>
  );
}
