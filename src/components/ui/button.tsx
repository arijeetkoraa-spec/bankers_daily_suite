import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        const variants = {
            default: "bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[0_4px_0_theme(colors.primary.DEFAULT/0.2)] hover:shadow-[0_2px_0_theme(colors.primary.DEFAULT/0.2)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]",
            destructive: "bg-gradient-to-b from-destructive to-destructive/80 text-destructive-foreground shadow-[0_4px_0_theme(colors.destructive.DEFAULT/0.2)] hover:shadow-[0_2px_0_theme(colors.destructive.DEFAULT/0.2)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]",
            outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-[0_4px_0_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0_rgba(0,0,0,0.05)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]",
            secondary: "bg-secondary text-secondary-foreground shadow-[0_4px_0_rgba(0,0,0,0.05)] hover:shadow-[0_2px_0_rgba(0,0,0,0.05)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px]",
            ghost: "hover:bg-accent hover:text-accent-foreground active:scale-95",
            link: "text-primary underline-offset-4 hover:underline active:scale-95",
        }

        const sizes = {
            default: "h-11 px-6 py-2.5",
            sm: "h-9 rounded-xl px-4",
            lg: "h-14 rounded-2xl px-10 text-base",
            icon: "h-11 w-11",
        }

        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-150 active:duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
                    variants[variant],
                    sizes[size],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
