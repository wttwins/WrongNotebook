import { addDays } from "date-fns";

// Ebbinghaus intervals in days: 1, 2, 4, 7, 15, 30
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

export function calculateNextReviewDate(currentStage: number): Date {
    const interval = REVIEW_INTERVALS[currentStage] || 30; // Default to 30 if stage exceeds
    return addDays(new Date(), interval);
}

export function getReviewStageDescription(stage: number): string {
    switch (stage) {
        case 0: return "First Review (1 day)";
        case 1: return "Second Review (2 days)";
        case 2: return "Third Review (4 days)";
        case 3: return "Fourth Review (7 days)";
        case 4: return "Fifth Review (15 days)";
        default: return "Maintenance Review (30 days)";
    }
}
