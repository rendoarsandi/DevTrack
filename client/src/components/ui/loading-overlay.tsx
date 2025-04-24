import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const loadingOverlayVariants = cva(
  "absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-200",
  {
    variants: {
      variant: {
        default: "bg-background/80 backdrop-blur-sm",
        light: "bg-white/50 backdrop-blur-[2px]",
        dark: "bg-black/50 backdrop-blur-[2px]",
        transparent: "bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface LoadingOverlayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingOverlayVariants> {
  isLoading: boolean;
  message?: string;
  spinnerSize?: "sm" | "md" | "lg";
  spinnerColor?: "default" | "primary" | "muted";
}

export function LoadingOverlay({
  className,
  variant,
  isLoading,
  message,
  spinnerSize = "md",
  spinnerColor = "primary",
  ...props
}: LoadingOverlayProps) {
  if (!isLoading) return null;
  
  return (
    <div
      className={cn(
        loadingOverlayVariants({ variant }),
        "z-50", // Pastikan overlay berada di atas semua komponen lain
        className
      )}
      {...props}
    >
      <LoadingSpinner size={spinnerSize} color={spinnerColor} />
      {message && (
        <p className="mt-3 text-sm font-medium text-center text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}