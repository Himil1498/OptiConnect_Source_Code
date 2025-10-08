import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Page Container Component
 * Provides consistent full-height layout for all pages
 * Height is calculated as 100vh - 64px (navbar height)
 */
const PageContainer: React.FC<PageContainerProps> = ({ children, className = "" }) => {
  return (
    <div className={`h-[calc(100vh-64px)] w-full overflow-auto ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
