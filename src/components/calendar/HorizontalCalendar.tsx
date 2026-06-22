import React, { useEffect, useMemo, useRef, useState } from "react";
import { ObsidianIcon } from "../shared/ObsidianIcon";

export type HorizontalCalendarMarkerTone =
	| "default"
	| "live"
	| "backtest"
	| "win"
	| "loss"
	| "warning"
	| "info";

export interface HorizontalCalendarMarker {
	tone?: HorizontalCalendarMarkerTone;
	label?: string;
}

export interface HorizontalCalendarLabels {
	ariaLabel: string;
	nextMonth: string;
	previousMonth: string;
	today: string;
}

export interface HorizontalCalendarProps {
	month?: string;
	defaultMonth?: string;
	selectedDate?: string;
	defaultSelectedDate?: string;
	today?: string;
	markersByDate?: Record<string, HorizontalCalendarMarker[] | undefined>;
	locale?: string;
	labels?: Partial<HorizontalCalendarLabels>;
	weekdayFormat?: "narrow" | "short" | "long";
	autoScroll?: "selected" | "today" | false;
	maxVisibleMarkers?: number;
	showHeader?: boolean;
	className?: string;
	onMonthChange?: (month: string) => void;
	onSelectDate?: (date: string) => void;
}

interface HorizontalCalendarDateCell {
	date: string;
	dayNumber: number;
}

const DEFAULT_LABELS: HorizontalCalendarLabels = {
	ariaLabel: "Horizontal calendar",
	nextMonth: "Next month",
	previousMonth: "Previous month",
	today: "Today",
};

const EMPTY_MARKERS_BY_DATE: Record<
	string,
	HorizontalCalendarMarker[] | undefined
> = {};

export function HorizontalCalendar({
	month,
	defaultMonth,
	selectedDate,
	defaultSelectedDate,
	today,
	markersByDate = EMPTY_MARKERS_BY_DATE,
	locale,
	labels,
	weekdayFormat = "short",
	autoScroll = "selected",
	maxVisibleMarkers = 3,
	showHeader = true,
	className,
	onMonthChange,
	onSelectDate,
}: HorizontalCalendarProps) {
	const calendarRef = useRef<HTMLDivElement>(null);
	const todayDate =
		normalizeDateKey(today) ?? formatHorizontalCalendarDateKey(new Date());
	const initialSelectedDate =
		normalizeDateKey(defaultSelectedDate) ?? todayDate;
	const controlledSelectedDate = normalizeDateKey(selectedDate);
	const [internalSelectedDate, setInternalSelectedDate] =
		useState(initialSelectedDate);
	const resolvedSelectedDate = controlledSelectedDate ?? internalSelectedDate;
	const initialMonth =
		normalizeMonthKey(defaultMonth) ??
		normalizeMonthKey(month) ??
		getHorizontalCalendarMonthKey(resolvedSelectedDate);
	const controlledMonth = normalizeMonthKey(month);
	const [internalMonth, setInternalMonth] = useState(initialMonth);
	const visibleMonth = controlledMonth ?? internalMonth;
	const [todayScrollRequest, setTodayScrollRequest] = useState(0);
	const resolvedLabels = { ...DEFAULT_LABELS, ...labels };
	const dates = useMemo(
		() => getHorizontalCalendarMonthDates(visibleMonth),
		[visibleMonth],
	);

	useEffect(() => {
		if (!autoScroll) {
			return;
		}

		const targetDate = autoScroll === "today" ? todayDate : resolvedSelectedDate;
		if (getHorizontalCalendarMonthKey(targetDate) !== visibleMonth) {
			return;
		}

		const timer = window.setTimeout(() => {
			scrollHorizontalCalendarDateIntoView(calendarRef.current, targetDate);
		}, 0);

		return () => window.clearTimeout(timer);
	}, [autoScroll, dates, resolvedSelectedDate, todayDate, visibleMonth]);

	useEffect(() => {
		if (todayScrollRequest === 0) {
			return;
		}

		if (getHorizontalCalendarMonthKey(todayDate) !== visibleMonth) {
			return;
		}

		const timer = window.setTimeout(() => {
			scrollHorizontalCalendarDateIntoView(calendarRef.current, todayDate);
		}, 0);

		return () => window.clearTimeout(timer);
	}, [todayDate, todayScrollRequest, visibleMonth]);

	const setVisibleMonth = (nextMonth: string) => {
		if (month === undefined) {
			setInternalMonth(nextMonth);
		}

		onMonthChange?.(nextMonth);
	};

	const selectDate = (date: string) => {
		if (selectedDate === undefined) {
			setInternalSelectedDate(date);
		}

		onSelectDate?.(date);
	};

	const goToAdjacentMonth = (offset: number) => {
		setVisibleMonth(addHorizontalCalendarMonths(visibleMonth, offset));
	};

	const goToToday = () => {
		setVisibleMonth(getHorizontalCalendarMonthKey(todayDate));
		selectDate(todayDate);
		setTodayScrollRequest((request) => request + 1);
	};

	return (
		<section className={["horizontal-calendar", className].filter(Boolean).join(" ")}>
			{showHeader ? (
				<header className="horizontal-calendar__header">
					<button
						type="button"
						className="horizontal-calendar__nav-button"
						aria-label={resolvedLabels.previousMonth}
						title={resolvedLabels.previousMonth}
						onClick={() => goToAdjacentMonth(-1)}
					>
						<ObsidianIcon iconId="chevron-left" />
					</button>
					<div className="horizontal-calendar__month">
						{formatMonthLabel(visibleMonth, locale)}
					</div>
					<button
						type="button"
						className="horizontal-calendar__nav-button"
						aria-label={resolvedLabels.nextMonth}
						title={resolvedLabels.nextMonth}
						onClick={() => goToAdjacentMonth(1)}
					>
						<ObsidianIcon iconId="chevron-right" />
					</button>
					<button
						type="button"
						className="horizontal-calendar__today-button"
						onClick={goToToday}
					>
						{resolvedLabels.today}
					</button>
				</header>
			) : null}

			<div
				className="horizontal-calendar__strip"
				aria-label={resolvedLabels.ariaLabel}
				ref={calendarRef}
			>
				{dates.map((calendarDate) => {
					const markers = markersByDate[calendarDate.date] ?? [];
					return (
						<HorizontalCalendarDateButton
							calendarDate={calendarDate}
							isSelected={calendarDate.date === resolvedSelectedDate}
							isToday={calendarDate.date === todayDate}
							key={calendarDate.date}
							locale={locale}
							markers={markers}
							maxVisibleMarkers={maxVisibleMarkers}
							todayLabel={resolvedLabels.today}
							weekdayFormat={weekdayFormat}
							onSelect={selectDate}
						/>
					);
				})}
			</div>
		</section>
	);
}

function HorizontalCalendarDateButton({
	calendarDate,
	isSelected,
	isToday,
	locale,
	markers,
	maxVisibleMarkers,
	todayLabel,
	weekdayFormat,
	onSelect,
}: {
	calendarDate: HorizontalCalendarDateCell;
	isSelected: boolean;
	isToday: boolean;
	locale: string | undefined;
	markers: HorizontalCalendarMarker[];
	maxVisibleMarkers: number;
	todayLabel: string;
	weekdayFormat: "narrow" | "short" | "long";
	onSelect: (date: string) => void;
}) {
	const date = parseHorizontalCalendarDateKey(calendarDate.date);
	const weekdayLabel = date
		? date.toLocaleDateString(locale, { weekday: weekdayFormat })
		: calendarDate.date.slice(5);
	const ariaLabel = getDateAriaLabel(
		calendarDate.date,
		locale,
		isToday,
		todayLabel,
		markers,
	);

	return (
		<button
			type="button"
			className={[
				"horizontal-calendar__day",
				isSelected ? "horizontal-calendar__day--selected" : "",
				isToday ? "horizontal-calendar__day--today" : "",
			]
				.filter(Boolean)
				.join(" ")}
			aria-label={ariaLabel}
			data-date={calendarDate.date}
			onClick={() => onSelect(calendarDate.date)}
		>
			<HorizontalCalendarMarkerDots
				markers={markers}
				maxVisibleMarkers={maxVisibleMarkers}
			/>
			<span className="horizontal-calendar__weekday">{weekdayLabel}</span>
			<span className="horizontal-calendar__day-number">
				{calendarDate.dayNumber}
			</span>
		</button>
	);
}

function HorizontalCalendarMarkerDots({
	markers,
	maxVisibleMarkers,
}: {
	markers: HorizontalCalendarMarker[];
	maxVisibleMarkers: number;
}) {
	const visibleMarkers = markers.slice(0, Math.max(0, maxVisibleMarkers));
	const hiddenMarkerCount = Math.max(0, markers.length - visibleMarkers.length);

	return (
		<span className="horizontal-calendar__markers" aria-hidden="true">
			{visibleMarkers.map((marker) => (
				<span
					className={[
						"horizontal-calendar__marker",
						`horizontal-calendar__marker--${marker.tone ?? "default"}`,
					].join(" ")}
					key={`${marker.tone ?? "default"}-${marker.label ?? "marker"}`}
					title={marker.label}
				/>
			))}
			{hiddenMarkerCount > 0 ? (
				<span className="horizontal-calendar__marker-more">
					+{hiddenMarkerCount}
				</span>
			) : null}
		</span>
	);
}

function scrollHorizontalCalendarDateIntoView(
	calendarEl: HTMLDivElement | null,
	date: string,
) {
	const targetEl = calendarEl?.querySelector<HTMLElement>(
		`[data-date="${date}"]`,
	);

	targetEl?.scrollIntoView({
		behavior: "auto",
		block: "nearest",
		inline: "center",
	});
}

export function getHorizontalCalendarMonthDates(
	monthKey: string,
): HorizontalCalendarDateCell[] {
	const { year, month } = parseMonthKey(monthKey);
	const monthStart = new Date(year, month, 1);
	const nextMonthStart = new Date(year, month + 1, 1);
	const dates: HorizontalCalendarDateCell[] = [];

	for (
		const date = new Date(monthStart);
		date < nextMonthStart;
		date.setDate(date.getDate() + 1)
	) {
		dates.push({
			date: formatHorizontalCalendarDateKey(date),
			dayNumber: date.getDate(),
		});
	}

	return dates;
}

export function addHorizontalCalendarMonths(
	monthKey: string,
	offset: number,
): string {
	const { year, month } = parseMonthKey(monthKey);
	return getHorizontalCalendarMonthKey(
		formatHorizontalCalendarDateKey(new Date(year, month + offset, 1)),
	);
}

export function getHorizontalCalendarMonthKey(dateKey: string): string {
	const normalizedDate = normalizeDateKey(dateKey);
	return normalizedDate
		? normalizedDate.slice(0, 7)
		: formatHorizontalCalendarDateKey(new Date()).slice(0, 7);
}

export function formatHorizontalCalendarDateKey(date: Date): string {
	return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function getDateAriaLabel(
	dateKey: string,
	locale: string | undefined,
	isToday: boolean,
	todayLabel: string,
	markers: HorizontalCalendarMarker[],
): string {
	const parsedDate = parseHorizontalCalendarDateKey(dateKey);
	const parts = [
		parsedDate
			? parsedDate.toLocaleDateString(locale, {
					day: "numeric",
					month: "long",
					weekday: "long",
					year: "numeric",
				})
			: dateKey,
	];

	if (isToday) {
		parts.push(todayLabel);
	}

	const markerLabels = markers
		.map((marker) => marker.label)
		.filter((label): label is string => Boolean(label));
	if (markerLabels.length > 0) {
		parts.push(markerLabels.join(", "));
	} else if (markers.length > 0) {
		parts.push(`${markers.length} marker${markers.length === 1 ? "" : "s"}`);
	}

	return parts.join(", ");
}

function formatMonthLabel(monthKey: string, locale: string | undefined): string {
	const { year, month } = parseMonthKey(monthKey);
	const monthLabel = new Date(year, month, 1).toLocaleString(locale, {
		month: "long",
		year: "numeric",
	});
	const firstLetter = monthLabel.slice(0, 1);
	return firstLetter
		? `${firstLetter.toLocaleUpperCase()}${monthLabel.slice(1)}`
		: monthLabel;
}

function parseMonthKey(monthKey: string): { year: number; month: number } {
	const normalizedMonth =
		normalizeMonthKey(monthKey) ??
		formatHorizontalCalendarDateKey(new Date()).slice(0, 7);
	const [yearPart = "", monthPart = ""] = normalizedMonth.split("-");
	const year = Number(yearPart);
	const month = Number(monthPart);

	return {
		year,
		month: month - 1,
	};
}

function normalizeMonthKey(monthKey: string | undefined): string | null {
	if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
		return null;
	}

	const [, monthPart = ""] = monthKey.split("-");
	const month = Number(monthPart);
	return month >= 1 && month <= 12 ? monthKey : null;
}

function normalizeDateKey(dateKey: string | undefined): string | null {
	if (!dateKey || !parseHorizontalCalendarDateKey(dateKey)) {
		return null;
	}

	return dateKey;
}

function parseHorizontalCalendarDateKey(dateKey: string): Date | null {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
		return null;
	}

	const [yearPart = "", monthPart = "", dayPart = ""] = dateKey.split("-");
	const year = Number(yearPart);
	const month = Number(monthPart);
	const day = Number(dayPart);

	if (
		!Number.isFinite(year) ||
		!Number.isFinite(month) ||
		!Number.isFinite(day)
	) {
		return null;
	}

	const date = new Date(year, month - 1, day);
	if (
		date.getFullYear() !== year ||
		date.getMonth() !== month - 1 ||
		date.getDate() !== day
	) {
		return null;
	}

	return date;
}

function padDatePart(value: number): string {
	return String(value).padStart(2, "0");
}
