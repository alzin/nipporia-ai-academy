import { TextField, InputAdornment } from "@mui/material";
import { UseFormRegisterReturn, FieldError } from "react-hook-form";

interface FormInputProps {
  label: string;
  type?: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  icon?: React.ReactNode;
  endIcon?: React.ReactNode;
  isRequired?: boolean;
  autoComplete?: string;
  helperText?: string;
}

export const FormInput = ({
  label,
  type = "text",
  registration,
  error,
  icon,
  endIcon,
  isRequired,
  autoComplete,
  helperText,
}: FormInputProps) => (
  <TextField
    fullWidth
    required={isRequired}
    label={label}
    type={type}
    autoComplete={autoComplete}
    {...registration}
    error={!!error}
    helperText={error?.message || helperText}
    InputProps={{
      startAdornment: icon ? (
        <InputAdornment position="start">{icon}</InputAdornment>
      ) : undefined,
      endAdornment: endIcon ? (
        <InputAdornment position="end">{endIcon}</InputAdornment>
      ) : undefined,
    }}
  />
);
