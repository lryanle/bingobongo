import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import bingocellIcon from "./bingocellicon";

const bingoCellVariants = cva(
	"flex w-26 h-26 p-2 flex-col items-center justify-between gap-1 shrink-0 rounded-2xl shadow backdrop-blur-xl",
	{
		variants: {
			variant: {
				default: "",
				battleship: "",
			},
			property: {
				default: "",
				title: "",
				slotted: "",
			},
			action: {
				default: "bg-card border border-border",
				disabled: "bg-muted/30 border border-border/50",
				locked: "bg-brown-600 bg-opacity-75 border-2 border-brown-950",
			},
		},
		defaultVariants: {
			variant: "default",
			property: "default",
			action: "default",
		},
	}
);

export interface BingoCellProps extends VariantProps<typeof bingoCellVariants> {
	readonly className?: string;
	readonly title: string;
	readonly slotItems?: Array<{ color: string; number: number }>;
	readonly disabled?: boolean;
	readonly favorite?: boolean;
	readonly locked?: boolean;
	readonly onClick?: () => void | Promise<void>;
}

export default function BingoCell({
	className,
	title,
	slotItems,
	variant,
	property,
	action,
	disabled,
	favorite,
	locked,
	onClick,
}: BingoCellProps) {
	const displaySlotItems =
		property === "slotted" &&
		title &&
		slotItems &&
		slotItems.length > 0 &&
		!action?.includes("disabled");

	const handleClick = () => {
		if (!disabled && !locked && onClick) {
			onClick();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if ((e.key === "Enter" || e.key === " ") && !disabled && !locked && onClick) {
			e.preventDefault();
			onClick();
		}
	};

	return (
		<div 
			className={cn("cursor-pointer", disabled && "cursor-not-allowed")}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			role={onClick ? "button" : undefined}
			tabIndex={onClick && !disabled && !locked ? 0 : undefined}
		>
			{favorite && (
				<div className="absolute flex items-start z-10 p-1 opacity-50 w-6 h-6">
					{bingocellIcon("favorite", "#FACC15")}
				</div>
			)}
			<div
				className={cn(
					bingoCellVariants({ variant, property, action, className }),
					title.length === 0 ? "bg-muted/30" : ""
				)}
			>
			{locked && <div className="text-foreground text-sm font-bold">Locked</div>}
			{!disabled && (
          <div className="flex flex-col content-center grow self-stretch text-foreground text-center text-xs font-normal rounded px-1">
            <div className="my-auto line-clamp-3 break-words leading-tight">{title || ""}</div>
          </div>
			)}
        {(locked && disabled) && (
          <div className="flex flex-col justify-center content-center items-center grow pb-6 self-stretch text-foreground text-center text-xs font-normal rounded">
            <div className="h-8 w-8">{bingocellIcon("locked", "#160909")}</div>
          </div>
				)}
				{displaySlotItems && (
					<div className="flex py-1 px-2 justify-center items-center gap-1 self-stretch rounded-2xl border border-border/50 bg-muted/30">
						{variant &&
							slotItems.map((item, i) =>
								bingocellIcon(variant, item.color, item.number, i)
							)}
					</div>
				)}
			</div>
		</div>
	);
}
