import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import bingocellIcon from "./bingocellicon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const bingoCellVariants = cva(
	"flex w-26 h-26 p-2 flex-col items-center justify-between gap-1 shrink-0 rounded-2xl drop-shadow-xs border-2 backdrop-blur-xl",
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
	readonly claimedBy?: {
		teamIndex: number;
		teamColor: string;
		claimedAt: Date;
	};
	readonly isWinning?: {
		teamColor: string;
	};
	readonly currentUserTeamIndex?: number;
	readonly myTeamClaim?: {
		teamIndex: number;
		teamColor: string;
		claimedAt: Date;
	};
}

function formatTimeAgo(date: Date): string {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSecs = Math.floor(diffMs / 1000);
	const diffMins = Math.floor(diffSecs / 60);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSecs < 60) {
		return `${diffSecs} second${diffSecs === 1 ? '' : 's'} ago`;
	} else if (diffMins < 60) {
		return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
	} else if (diffHours < 24) {
		return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
	} else {
		return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
	}
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
	claimedBy,
	isWinning,
	currentUserTeamIndex,
	myTeamClaim,
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

	// Determine cell style based on winning status or claim status
	// Show glow/outline if the current user's team has claimed this cell (even if other teams also claimed it)
	const isClaimedByMyTeam = myTeamClaim !== undefined;
	
	let cellStyle: React.CSSProperties | undefined;
	if (isWinning) {
		cellStyle = {
			backgroundColor: isWinning.teamColor,
			boxShadow: `0 0 12px ${isWinning.teamColor}70, 0 0 24px ${isWinning.teamColor}50, inset 0 0 12px ${isWinning.teamColor}40`,
			borderColor: isWinning.teamColor,
			borderWidth: '3px',
		};
	} else if (isClaimedByMyTeam && myTeamClaim) {
		// Show glow/outline if claimed by current user's team (even if other teams also claimed it)
		cellStyle = {
			boxShadow: `0 0 8px ${myTeamClaim.teamColor}50, 0 0 16px ${myTeamClaim.teamColor}40, inset 0 0 8px ${myTeamClaim.teamColor}20`,
			borderColor: myTeamClaim.teamColor,
			borderWidth: '2px',
			background: `linear-gradient(135deg, ${myTeamClaim.teamColor}15 0%, ${myTeamClaim.teamColor}05 100%)`,
		};
	}

	return (
		<button 
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
					title.length === 0 ? "bg-muted/30" : "",
					(claimedBy || isWinning) ? "relative" : ""
				)}
				style={cellStyle}
			>
			{claimedBy && (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="absolute top-1 right-1 z-10 cursor-help">
								{/* Tooltip trigger - invisible but covers the slot items area */}
								<div className="w-full h-full" />
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p>Claimed by Team {claimedBy.teamIndex + 1} {formatTimeAgo(claimedBy.claimedAt)}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
			{locked && <div className="text-foreground text-sm font-bold">Locked</div>}
			{!disabled && (
          <div className="flex flex-col content-center grow self-stretch text-foreground text-center text-xs font-normal rounded px-1">
            <div className="my-auto line-clamp-3 wrap-break-words leading-tight">{title || ""}</div>
          </div>
			)}
        {(locked && disabled) && (
          <div className="flex flex-col justify-center content-center items-center grow pb-6 self-stretch text-foreground text-center text-xs font-normal rounded">
            <div className="h-8 w-8">{bingocellIcon("locked", "#160909")}</div>
          </div>
				)}
				{displaySlotItems && (
					<div className="flex py-1 px-2 justify-center items-center gap-1 self-stretch rounded-2xl border border-border/80 bg-muted/20 drop-shadow-inner">
						{variant &&
							slotItems.map((item, i) =>
								bingocellIcon(variant, item.color, item.number, i)
							)}
					</div>
				)}
			</div>
		</button>
	);
}
