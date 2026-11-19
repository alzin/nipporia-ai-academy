// frontend/src/utils/sweetAlert.ts
import Swal from 'sweetalert2'

const MySwal = Swal;

export interface SweetAlertOptions {
  title?: string;
  text?: string;
  icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
}

export const useSweetAlert = () => {
  const showAlert = (options: SweetAlertOptions) => {
    return MySwal.fire({
      title: options.title || 'お知らせ',
      text: options.text || '',
      icon: options.icon || 'info',
      confirmButtonText: options.confirmButtonText || 'OK',
      confirmButtonColor: options.confirmButtonColor || '#AE4A24',
      customClass: {
        popup: 'sweet-alert-popup',
        title: 'sweet-alert-title',
        confirmButton: 'sweet-alert-confirm',
        cancelButton: 'sweet-alert-cancel',
      },
      ...options,
    });
  };

  const showConfirm = (options: SweetAlertOptions) => {
    return MySwal.fire({
      title: options.title || 'よろしいですか？',
      text: options.text || '',
      icon: options.icon || 'warning',
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || 'はい',
      cancelButtonText: options.cancelButtonText || 'キャンセル',
      confirmButtonColor: options.confirmButtonColor || '#AE4A24',
      cancelButtonColor: options.cancelButtonColor || '#5F5B54',
      customClass: {
        popup: 'sweet-alert-popup',
        title: 'sweet-alert-title',
        confirmButton: 'sweet-alert-confirm',
        cancelButton: 'sweet-alert-cancel',
      },
      ...options,
    });
  };

  const showSuccess = (title: string, text?: string) => {
    return showAlert({
      title,
      text,
      icon: 'success',
      confirmButtonText: 'OK',
    });
  };

  const showSuccessToast = (title: string, text?: string) => {
    return MySwal.fire({
      title,
      text,
      icon: 'success',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      showCloseButton: true,
      timer: 8000,
      timerProgressBar: false,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', MySwal.stopTimer);
        toast.addEventListener('mouseleave', MySwal.resumeTimer);
        // Keep the toast above MUI dialogs
        const container = toast.closest('.swal2-container') as HTMLElement;
        if (container) {
          container.style.zIndex = '999999';
        }
      },
      closeButtonAriaLabel: '閉じる',
      customClass: {
        popup: 'nipporia-toast',
        title: 'nipporia-toast-title',
      },
    });
  };

  const showError = (title: string, text?: string) => {
    return showAlert({
      title,
      text,
      icon: 'error',
      confirmButtonText: 'OK',
    });
  };

  const showWarning = (title: string, text?: string) => {
    return showAlert({
      title,
      text,
      icon: 'warning',
      confirmButtonText: 'OK',
    });
  };

  const showInfo = (title: string, text?: string) => {
    return showAlert({
      title,
      text,
      icon: 'info',
      confirmButtonText: 'OK',
    });
  };

  return {
    showAlert,
    showConfirm,
    showSuccess,
    showSuccessToast,
    showError,
    showWarning,
    showInfo,
  };
};
