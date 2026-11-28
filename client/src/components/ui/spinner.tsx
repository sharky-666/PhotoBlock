import { cn } from "@/lib/utils";
import ShutterSpinner from "@client/src/components/ui/shutter-spinner";

interface SpinnerProps {
  className?: string;
  size?: number;
}

function Spinner({ className, size = 16 }: SpinnerProps) {
  return (
    <ShutterSpinner
      size={size}
      className={cn("animate-spin text-primary", className)}
    />
  );
}

export { Spinner };
