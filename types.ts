
export enum MatchStatus {
  LIVE = 'LIVE',
  RESULT = 'RESULT',
  UPCOMING = 'UPCOMING'
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface PlayerStat {
  name: string;
  score?: string; // e.g. "45 (30)" or "2/24 (4.0)"
  details?: string; // e.g. "SR: 150.0" or "Econ: 6.0"
}

export interface LiveUpdate {
  score: string;
  commentary: string;
  recentBalls: string[];
  keyMoment: string;
  summary: string;
  topBatters: PlayerStat[];
  topBowlers: PlayerStat[];
  timestamp: number;
}

export interface GeneratedPost {
  matchId: string;
  headline: string;
  description: string;
  hashtags: string;
  imageUrl: string;
  generatedAt: number;
}

export interface CricketMatch {
  id: string;
  teamA: string;
  teamB: string;
  status: string;
  venue: string;
  matchType: string;
  dateTime?: string;
  scoreA?: string;
  scoreB?: string;
  winner?: string;
  statusType: MatchStatus;
  newsHeadline?: string;
  matchContext?: string;
  publishedAt: number;
  sources?: GroundingSource[];
}
