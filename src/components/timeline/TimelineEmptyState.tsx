import React from "react";
import { t } from "../../i18n";
import type { TimelineLanguage } from "../../models/TimelineSettings";
import { ObsidianIcon } from "../shared/ObsidianIcon";

interface TimelineEmptyStateProps {
	language: TimelineLanguage;
	hasTimelineEntries: boolean;
	onCreateCheckIn: () => void;
}

export const TimelineEmptyState: React.FC<TimelineEmptyStateProps> = ({
	language,
	hasTimelineEntries,
	onCreateCheckIn,
}) => {
	const titleKey = hasTimelineEntries
		? "timeline.emptyFilteredTitle"
		: "timeline.emptyTitle";
	const descriptionKey = hasTimelineEntries
		? "timeline.emptyFilteredDescription"
		: "timeline.emptyDescription";

	return (
		<div className="timeline-empty-state">
			<div className="timeline-empty-icon" aria-hidden="true">
				<ObsidianIcon iconId={hasTimelineEntries ? "search" : "calendar"} />
			</div>
			<div className="timeline-empty-copy">
				<h3>{t(language, titleKey)}</h3>
				<p>{t(language, descriptionKey)}</p>
			</div>
			{!hasTimelineEntries && (
				<button
					type="button"
					className="timeline-empty-action"
					onClick={onCreateCheckIn}
				>
					<ObsidianIcon iconId="plus" />
					<span>{t(language, "timeline.createCheckIn")}</span>
				</button>
			)}
		</div>
	);
};
