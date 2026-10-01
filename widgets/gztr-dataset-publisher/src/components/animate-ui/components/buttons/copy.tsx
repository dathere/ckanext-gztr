import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon, CopyIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as React from "react";

import {
  Button as ButtonPrimitive,
  type ButtonProps as ButtonPrimitiveProps,
} from "@/components/animate-ui/primitives/buttons/button";
import { useControlledState } from "@/hooks/use-controlled-state";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "tw:flex tw:items-center tw:justify-center tw:rounded-md tw:transition-[box-shadow,_color,_background-color,_border-color,_outline-color,_text-decoration-color,_fill,_stroke] tw:disabled:pointer-events-none tw:disabled:opacity-50 tw:[&_svg]:pointer-events-none tw:[&_svg:not([class*=size-])]:size-4 tw:shrink-0 tw:[&_svg]:shrink-0 tw:outline-none tw:focus-visible:border-ring tw:focus-visible:ring-ring/50 tw:focus-visible:ring-[3px] tw:aria-invalid:ring-destructive/20 tw:dark:aria-invalid:ring-destructive/40 tw:aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "tw:bg-primary tw:text-primary-foreground tw:shadow-xs tw:hover:bg-primary/90",
        accent:
          "tw:bg-accent tw:text-accent-foreground tw:shadow-xs tw:hover:bg-accent/90",
        destructive:
          "tw:bg-destructive tw:text-white tw:shadow-xs tw:hover:bg-destructive/90 tw:focus-visible:ring-destructive/20 tw:dark:focus-visible:ring-destructive/40 tw:dark:bg-destructive/60",
        outline:
          "tw:border tw:bg-background tw:shadow-xs tw:hover:bg-accent tw:hover:text-accent-foreground tw:dark:bg-input/30 tw:dark:border-input tw:dark:hover:bg-input/50",
        secondary:
          "tw:bg-secondary tw:text-secondary-foreground tw:shadow-xs tw:hover:bg-secondary/80",
        ghost:
          "tw:hover:bg-accent tw:hover:text-accent-foreground tw:dark:hover:bg-accent/50",
        link: "tw:text-primary tw:underline-offset-4 tw:hover:underline",
      },
      size: {
        default: "tw:size-9",
        xs: "tw:size-7 tw:[&_svg:not([class*=size-])]:size-3.5 tw:rounded-md",
        sm: "tw:size-8 tw:rounded-md",
        lg: "tw:size-10 tw:rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type CopyButtonProps = Omit<ButtonPrimitiveProps, "children"> &
  VariantProps<typeof buttonVariants> & {
    content: string;
    copied?: boolean;
    onCopiedChange?: (copied: boolean, content?: string) => void;
    delay?: number;
  };

function CopyButton({
  className,
  content,
  copied,
  onCopiedChange,
  onClick,
  variant,
  size,
  delay = 3000,
  ...props
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useControlledState({
    value: copied,
    onChange: onCopiedChange,
  });

  const handleCopy = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (copied) return;
      if (content) {
        navigator.clipboard
          .writeText(content)
          .then(() => {
            setIsCopied(true);
            onCopiedChange?.(true, content);
            setTimeout(() => {
              setIsCopied(false);
              onCopiedChange?.(false);
            }, delay);
          })
          .catch((error) => {
            console.error("Error copying command", error);
          });
      }
    },
    [onClick, copied, content, setIsCopied, onCopiedChange, delay],
  );

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <ButtonPrimitive
      data-slot="copy-button"
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleCopy}
      {...props}
    >
      <AnimatePresence mode="popLayout">
        <Icon />
      </AnimatePresence>
    </ButtonPrimitive>
  );
}

export { buttonVariants, CopyButton, type CopyButtonProps };
