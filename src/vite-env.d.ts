/// <reference types="vite/client" />

interface Window {
  fbq?: (...args: any[]) => void;
  _fbq?: (...args: any[]) => void;
}
