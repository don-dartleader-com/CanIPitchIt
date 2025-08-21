import { ScoreResult } from '../types';
export declare class ScoringService {
    calculateScore(responses: Record<number, number>, templateId: number): Promise<ScoreResult>;
    private calculatePercentileRank;
    private identifyStrengths;
    private identifyWeaknesses;
    private generateRecommendations;
    getIndustryBenchmarks(industry: string, stage: string): Promise<any>;
    updateBenchmarks(assessment: any, results: ScoreResult): Promise<void>;
}
export declare const scoringService: ScoringService;
//# sourceMappingURL=scoringService.d.ts.map