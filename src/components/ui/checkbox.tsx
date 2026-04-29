/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react"
import * as CheckboxPrimitives from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitives.Root>) {
  return (
    <CheckboxPrimitives.Root
      data-slot="checkbox"
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-slate-200 shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#B8860B] data-[state=checked]:text-white",
        className
      )}
      {...props}
    >
      <CheckboxPrimitives.Indicator
        data-slot="checkbox-indicator"
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className="h-3.5 w-3.5" />
      </CheckboxPrimitives.Indicator>
    </CheckboxPrimitives.Root>
  )
}

export { Checkbox }
