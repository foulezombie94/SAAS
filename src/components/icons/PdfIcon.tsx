import React from 'react';

interface PdfIconProps {
  className?: string;
  size?: number;
  fill?: string;
}

export function PdfIcon({ className, size = 24, fill = "currentColor" }: PdfIconProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      id="Picture-As-Pdf-Fill--Streamline-Sharp-Fill-Material" 
      height={size} 
      width={size}
      className={className}
    >
      <desc>
        Picture As Pdf Fill Streamline Icon: https://streamlinehq.com
      </desc>
      <path 
        fill={fill} 
        d="M8.275 13.225h0.925V11.15h1.75l0.375 -0.375v-2.3l-0.375 -0.375h-2.675v5.125Zm0.925 -3v-1.2h1.2v1.2h-1.2Zm3.225 3h2.65l0.375 -0.375v-4.375l-0.375 -0.375h-2.65v5.125Zm0.925 -0.925v-3.275h1.175v3.275H13.35Zm3.325 0.925h0.925V11.15h1.25v-0.925h-1.25v-1.2h1.25V8.1h-2.175v5.125ZM5 19V2h17v17H5Zm-3 3V5h1.5v15.5h15.5v1.5H2Z" 
        strokeWidth="0.5"
      ></path>
    </svg>
  );
}
