import React, { useEffect, useState } from "react";

interface toggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}
const ToggleSwitch= (props: toggleProps) => (
  <button
    type="button"
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      props.disabled 
        ? 'cursor-not-allowed opacity-50' 
        : 'cursor-pointer'
    } ${
      props.checked 
        ? 'bg-blue-600' 
        : 'bg-gray-200 dark:bg-gray-700'
    }`}
    onClick={() => !props.disabled && props.onChange(!props.checked)}
    disabled={props.disabled}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
        props.checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export default ToggleSwitch;