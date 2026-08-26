import { useTheme } from "next-themes";
import * as React from "react";
import { CopyButton } from "@/components/animate-ui/components/buttons/copy";
import {
  CodeBlock as CodeBlockPrimitive,
  type CodeBlockProps as CodeBlockPropsPrimitive,
} from "@/components/animate-ui/primitives/animate/code-block";
import { getStrictContext } from "@/lib/get-strict-context";
import { cn } from "@/lib/utils";

type CodeContextType = {
  code: string;
};

const [CodeProvider, useCode] =
  getStrictContext<CodeContextType>("CodeContext");

type CodeProps = React.ComponentProps<"div"> & {
  code: string;
};

function Code({ className, code, ...props }: CodeProps) {
  return (
    <CodeProvider value={{ code }}>
      <div
        className={cn(
          "tw:relative tw:flex tw:flex-col tw:overflow-hidden tw:border tw:bg-accent/50 tw:rounded-lg",
          className,
        )}
        {...props}
      />
    </CodeProvider>
  );
}

type CodeHeaderProps = React.ComponentProps<"div"> & {
  icon?: React.ElementType;
  copyButton?: boolean;
};

function CodeHeader({
  className,
  children,
  icon: Icon,
  copyButton = false,
  ...props
}: CodeHeaderProps) {
  const { code } = useCode();

  return (
    <div
      className={cn(
        "tw:bg-accent tw:shrink-0 tw:gap-x-2 tw:border-b tw:border-border/75 tw:dark:border-border/50 tw:text-sm tw:flex tw:text-muted-foreground tw:items-center tw:px-4 tw:w-full tw:h-10",
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="tw:size-4" />}
      <div className="tw:w-full tw:flex tw:justify-between tw:items-center">
        {children}
        {copyButton && (
          <CopyButton
            content={code}
            size="xs"
            variant="ghost"
            className="tw:ml-auto tw:w-auto tw:h-auto tw:p-2 tw:-mr-2"
          />
        )}
      </div>
    </div>
  );
}

type CodeBlockProps = Omit<CodeBlockPropsPrimitive, "code"> & {
  cursor?: boolean;
};

function CodeBlock({ cursor, className, ...props }: CodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const { code } = useCode();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <CodeBlockPrimitive
      ref={scrollRef}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      scrollContainerRef={scrollRef}
      className={cn(
        "tw:relative tw:text-sm tw:p-4 tw:overflow-auto",
        "tw:[&>pre,_&_code]:!bg-transparent tw:[&>pre,_&_code]:[background:transparent_!important] tw:[&>pre,_&_code]:border-none tw:[&_code]:!text-[13px] tw:[&_code_.line]:!px-0",
        cursor &&
          "tw:data-[done=false]:[&_.line:last-of-type::after]:content-[|] tw:data-[done=false]:[&_.line:last-of-type::after]:inline-block tw:data-[done=false]:[&_.line:last-of-type::after]:w-[1ch] tw:data-[done=false]:[&_.line:last-of-type::after]:-translate-px",
        className,
      )}
      code={code}
      {...props}
    />
  );
}

export {
  Code,
  CodeBlock,
  type CodeBlockProps,
  CodeHeader,
  type CodeHeaderProps,
  type CodeProps,
};
