import React from "react";
import { t } from "../../i18n";
import type { TimelineLanguage } from "../../models/TimelineSettings";
import { HeaderActionButton } from "./HeaderActionButton";

export type TimelineActivePanel = "composer" | "search" | "filter" | null;

interface TimelineHeaderProps {
	language: TimelineLanguage;
	subtitle: string;
	activePanel: TimelineActivePanel;
	onCreateToggle: () => void;
	onSearchToggle: () => void;
	onFilterToggle: () => void;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
	language,
	subtitle,
	activePanel,
	onCreateToggle,
	onSearchToggle,
	onFilterToggle,
}) => {
	return (
		<div className="timeline-header">
			<div className="timeline-header-text">
				<h2>{t(language, "timeline.title")}</h2>
				<div className="timeline-date-label">{subtitle}</div>
			</div>
			<div className="timeline-header-actions">
				<HeaderActionButton
					iconId="search"
					label={t(language, "common.search")}
					isActive={activePanel === "search"}
					onClick={onSearchToggle}
				/>
				<HeaderActionButton
					iconId="filter"
					label={t(language, "common.filter")}
					isActive={activePanel === "filter"}
					onClick={onFilterToggle}
				/>
				<HeaderActionButton
					iconId="plus"
					label={t(language, "timeline.createCheckIn")}
					isActive={activePanel === "composer"}
					onClick={onCreateToggle}
				/>
			</div>
		</div>
	);
};
