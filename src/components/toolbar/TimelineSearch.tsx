import React from "react";

interface TimelineSearchProps {
	value: string;
	onSearchInput: (value: string) => void;
}

export const TimelineSearch: React.FC<TimelineSearchProps> = ({
	value,
	onSearchInput,
}) => {
	return (
		<div>
			<input
				type="search"
				className="timeline-input"
				placeholder="Search text, content, tags..."
				value={value}
				onChange={(e) => onSearchInput(e.target.value)}
			/>
		</div>
	);
};
