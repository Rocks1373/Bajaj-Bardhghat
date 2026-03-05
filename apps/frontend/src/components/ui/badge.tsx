import { cn } from "@/lib/utils"

function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }) {
    const variants: Record<string, string> = {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border",
        success: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    }

    return (
        <div className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            variants[variant],
            className
        )} {...props} />
    )
}

export { Badge }
