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
				default: "bg-neutral-800 bg-opacity-75",
				disabled: "bg-neutral-800 bg-opacity-15",
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
	className?: string;
	title: string;
	slotItems?: [{ color: string; number: number }];
	disabled?: boolean;
	favorite?: boolean;
	locked?: boolean;
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
}: BingoCellProps) {
	const displaySlotItems =
		property === "slotted" &&
		title &&
		slotItems &&
		slotItems.length > 0 &&
		!action?.includes("disabled");

	return (
		<div className="cursor-pointer">
			{favorite && (
				<div className="absolute flex items-start z-10 p-1 opacity-50 w-6 h-6">
					{bingocellIcon("favorite", "#FACC15")}
				</div>
			)}
			<div
				className={cn(
					bingoCellVariants({ variant, property, action, className }),
					!(title.length > 0) ? "bg-neutral-800 bg-opacity-15" : ""
				)}
			>
				{locked && <div className="text-brown-950 text-sm font-bold">Locked</div>}
				{!disabled && (
          <div className="flex flex-col content-center grow self-stretch text-white text-center text-xs font-normal overflow-y-scroll rounded">
            <div className="my-auto">{title}</div>
          </div>
				)}
        {(locked && disabled) && (
          <div className="flex flex-col justify-center content-center items-center grow pb-6 self-stretch text-white text-center text-xs font-normal overflow-y-scroll rounded">
            <div className="h-8 w-8">{bingocellIcon("locked", "#160909")}</div>
          </div>
				)}
				{displaySlotItems && (
					<div className="flex py-1 px-2 justify-center items-center gap-1 self-stretch rounded-2xl border border-solid border-white border-opacity-10 bg-white bg-opacity-5">
						{variant &&
							slotItems.map((item) =>
								bingocellIcon(variant, item.color, item.number)
							)}
					</div>
				)}
			</div>
		</div>
	);
}
