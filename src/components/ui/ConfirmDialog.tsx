import React from 'react'
import Image from 'next/image'

type ConfirmDialogProps = {
  title?: string;
  message: string;
  subMessage?: string;
  imageSrc?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  inputError?: string;
};

function ConfirmDialog({
  title = 'Confirm',
  message,
  subMessage,
  imageSrc = '/no-results.png',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  inputLabel,
  inputPlaceholder,
  inputValue,
  onInputChange,
  inputError,
}: ConfirmDialogProps) {
  return (
    <div className="overlay-modal p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-orange-500/10 via-orange-400/5 to-transparent" />
        <div className="relative space-y-4 p-6 text-center">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt="dialog illustration"
              width={180}
              height={180}
              className="mx-auto drop-shadow-lg"
              priority
            />
          ) : null}

          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-sm text-amber-100">{message}</p>
            {subMessage ? <p className="text-xs text-zinc-200">{subMessage}</p> : null}
          </div>

          {onInputChange ? (
            <div className="text-left space-y-1">
              {inputLabel ? <label className="text-xs text-zinc-200">{inputLabel}</label> : null}
              <input
                value={inputValue ?? ''}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={inputPlaceholder}
                className="input-base rounded-lg"
              />
              {inputError ? <p className="text-xs text-rose-300">{inputError}</p> : null}
            </div>
          ) : null}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onConfirm}
              className="btn-primary"
            >
              {confirmText}
            </button>
            <button
              onClick={onCancel}
              className="btn-outline"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
