import React, { useEffect, useRef } from "react";
import { setIcon } from "obsidian";

interface ObsidianIconProps {
	iconId: string;
	className?: string;
}

export const ObsidianIcon: React.FC<ObsidianIconProps> = ({
	iconId,
	className = "",
}) => {
	const ref = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (ref.current) {
			ref.current.empty();
			setIcon(ref.current, iconId);
		}
	}, [iconId]);

	return <span ref={ref} className={className} />;
};
