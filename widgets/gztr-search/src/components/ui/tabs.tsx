import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "tw:group/tabs tw:flex tw:gap-2 tw:data-[orientation=horizontal]:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "tw:rounded-lg tw:p-[3px] tw:group-data-[orientation=horizontal]/tabs:h-9 tw:data-[variant=line]:rounded-none tw:group/tabs-list tw:text-muted-foreground tw:inline-flex tw:w-fit tw:items-center tw:justify-center tw:group-data-[orientation=vertical]/tabs:h-fit tw:group-data-[orientation=vertical]/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "tw:bg-muted",
        line: "tw:gap-1 tw:bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "tw:focus-visible:border-ring tw:focus-visible:ring-ring/50 tw:focus-visible:outline-ring tw:text-foreground/60 tw:hover:text-foreground tw:dark:text-muted-foreground tw:dark:hover:text-foreground tw:relative tw:inline-flex tw:h-[calc(100%-1px)] tw:flex-1 tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-md tw:border tw:border-transparent tw:px-2 tw:py-1 tw:text-sm tw:font-medium tw:whitespace-nowrap tw:transition-all tw:group-data-[orientation=vertical]/tabs:w-full tw:group-data-[orientation=vertical]/tabs:justify-start tw:focus-visible:ring-[3px] tw:focus-visible:outline-1 tw:disabled:pointer-events-none tw:disabled:opacity-50 tw:group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm tw:group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none tw:[&_svg]:pointer-events-none tw:[&_svg]:shrink-0 tw:[&_svg:not([class*=size-])]:size-4",
        "tw:group-data-[variant=line]/tabs-list:bg-transparent tw:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent tw:dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent tw:dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent",
        "tw:data-[state=active]:bg-background tw:dark:data-[state=active]:text-foreground tw:dark:data-[state=active]:border-input tw:dark:data-[state=active]:bg-input/30 tw:data-[state=active]:text-foreground",
        "tw:after:bg-foreground tw:after:absolute tw:after:opacity-0 tw:after:transition-opacity tw:group-data-[orientation=horizontal]/tabs:after:inset-x-0 tw:group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] tw:group-data-[orientation=horizontal]/tabs:after:h-0.5 tw:group-data-[orientation=vertical]/tabs:after:inset-y-0 tw:group-data-[orientation=vertical]/tabs:after:-right-1 tw:group-data-[orientation=vertical]/tabs:after:w-0.5 tw:group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("tw:flex-1 tw:outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
