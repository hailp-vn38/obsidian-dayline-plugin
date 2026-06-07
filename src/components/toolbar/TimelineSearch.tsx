import React from "react";
import { t } from "../../i18n";
import type { TimelineLanguage } from "../../models/TimelineSettings";

interface TimelineSearchProps {
	language: TimelineLanguage;
	value: string;
	onSearchInput: (value: string) => void;
}

export const TimelineSearch: React.FC<TimelineSearchProps> = ({
	language,
	value,
	onSearchInput,
}) => {
	return (
		<div className="timeline-search-panel">
			<input
				type="search"
				className="timeline-input"
				placeholder={t(language, "timeline.searchPlaceholder")}
				value={value}
				onChange={(e) => onSearchInput(e.target.value)}
			/>
		</div>
	);
};
