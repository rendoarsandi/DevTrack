import { useState } from "react";

interface UseLoadingOptions {
  initialState?: boolean;
  loadingTimeout?: number; // minimum loading time in ms
}

export function useLoading({
  initialState = false,
  loadingTimeout = 0,
}: UseLoadingOptions = {}) {
  const [isLoading, setIsLoading] = useState(initialState);

  // Start loading with optional minimum duration
  const startLoading = () => {
    setIsLoading(true);
  };

  // Stop loading with optional minimum duration
  const stopLoading = () => {
    if (loadingTimeout > 0) {
      setTimeout(() => {
        setIsLoading(false);
      }, loadingTimeout);
    } else {
      setIsLoading(false);
    }
  };

  // Wrap an async function with loading state
  const withLoading = async <T extends any>(
    asyncFn: () => Promise<T>,
  ): Promise<T> => {
    try {
      startLoading();
      const start = Date.now();
      const result = await asyncFn();
      
      // Ensure minimum loading time if specified
      const elapsed = Date.now() - start;
      if (loadingTimeout > 0 && elapsed < loadingTimeout) {
        await new Promise(resolve => 
          setTimeout(resolve, loadingTimeout - elapsed)
        );
      }
      
      return result;
    } finally {
      stopLoading();
    }
  };

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  };
}