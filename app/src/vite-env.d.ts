/// <reference types="vite/client" />

// Allow importing CSV files as raw strings
declare module '*.csv?raw' {
  const content: string;
  export default content;
}
