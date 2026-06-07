import React from "react";
import { ObsidianIcon } from "../shared/ObsidianIcon";

interface HeaderActionButtonProps {
	iconId: string;
	label: string;
	isActive?: boolean;
	onClick: () => void;
}

export const HeaderActionButton: React.FC<HeaderActionButtonProps> = ({
	iconId,
	label,
	isActive = false,
	onClick,
}) => {
	return (
		<button
			className={`timeline-header-action${isActive ? " is-active" : ""}`}
			type="button"
			aria-label={label}
			aria-pressed={isActive}
			title={label}
			onClick={onClick}
		>
			<ObsidianIcon iconId={iconId} className="timeline-header-action-icon" />
		</button>
	);
};
