
import { GoogleGenAI, Type } from "@google/genai";
import { CricketMatch, MatchStatus, GeneratedPost, GroundingSource, LiveUpdate } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const RAPID_API_KEY = "ead868819bmshf2a54bf1c83a8bdp120631jsnb0617831b48e";
const RAPID_API_HOST = "cricket-api-free-data.p.rapidapi.com";

export async function fetchLiveMatches(): Promise<CricketMatch[]> {
  try {
    const rapidResponse = await fetch(`https://${RAPID_API_HOST}/match-list`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': RAPID_API_HOST
      }
    });
    
    let rawMatchData = [];
    if (rapidResponse.ok) {
      const data = await rapidResponse.json();
      rawMatchData = data.matches || data.data || [];
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `CRITICAL SPORTS NEWS AGGREGATOR:
      Search for the latest breaking cricket news from the LAST 24 HOURS. 
      Specifically look for Match Results, Player Milestones, and Live Score updates.
      
      CROSS-REFERENCE with these signals: ${JSON.stringify(rawMatchData.slice(0, 10))}
      
      Return for EACH match:
      1. Accurate Score/Result.
      2. Viral news headline.
      3. Journalistic context (milestones, stats).
      4. Published timestamp (Unix ms).
      5. Match status (LIVE, RESULT, or UPCOMING).
      
      Order by latest first. Return a JSON array.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              teamA: { type: Type.STRING },
              teamB: { type: Type.STRING },
              status: { type: Type.STRING },
              venue: { type: Type.STRING },
              matchType: { type: Type.STRING },
              statusType: { type: Type.STRING },
              winner: { type: Type.STRING },
              newsHeadline: { type: Type.STRING },
              matchContext: { type: Type.STRING },
              publishedAt: { type: Type.NUMBER }
            },
            required: ["teamA", "teamB", "status", "venue", "matchType", "statusType", "newsHeadline", "matchContext", "publishedAt"]
          }
        }
      },
    });

    const enrichedData = JSON.parse(response.text || "[]");
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const webSources: GroundingSource[] = groundingChunks?.map((chunk: any) => chunk.web).filter(Boolean) || [];

    return enrichedData.map((m: any, index: number) => ({
      ...m,
      id: `match-${index}-${m.publishedAt}`,
      statusType: (m.statusType || "UPCOMING").toUpperCase() as MatchStatus,
      sources: [...webSources, { uri: `https://${RAPID_API_HOST}`, title: "RapidAPI Signal" }]
    }));
  } catch (error) {
    console.error("News Aggregation Error:", error);
    return [];
  }
}

export async function fetchSpecificMatchUpdate(match: CricketMatch): Promise<LiveUpdate> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `LIVE MATCH TRACKER & DETAILED SCORECARD: 
    Find the COMPLETE current situation for: ${match.teamA} vs ${match.teamB}.
    Search for:
    - Current score, overs, and run rate.
    - Full match summary narrative.
    - Top 3 Batters (Name, runs, balls, strike rate, boundaries).
    - Top 3 Bowlers (Name, overs, wickets, runs, economy).
    - Last 6 balls detailed commentary.
    - Most critical milestone or moment in the last 5 overs.
    
    Return JSON.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.STRING },
          summary: { type: Type.STRING },
          commentary: { type: Type.STRING },
          recentBalls: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyMoment: { type: Type.STRING },
          topBatters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                score: { type: Type.STRING },
                details: { type: Type.STRING }
              }
            }
          },
          topBowlers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                score: { type: Type.STRING },
                details: { type: Type.STRING }
              }
            }
          }
        },
        required: ["score", "summary", "commentary", "recentBalls", "keyMoment", "topBatters", "topBowlers"]
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  return {
    ...data,
    timestamp: Date.now()
  };
}

export async function generatePostContent(match: CricketMatch, customContext?: string): Promise<{ headline: string; description: string; hashtags: string }> {
  const context = customContext || match.newsHeadline;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Write an EXPERT, viral Facebook post for 'CrickMic'.
    Context: ${context}.
    Match: ${match.teamA} vs ${match.teamB}.
    
    INSTRUCTIONS:
    1. If context refers to a specific player, focus the post entirely on their "Hero" moment and individual stats.
    2. If context is a "Summary", write a deep tactical analysis of the match's flow.
    3. If context is "Update", make it a punchy score update.
    4. Start with a high-energy hook.
    5. Include a clean performance breakdown (stats) formatted for readability.
    6. Ending with a high-engagement question.
    7. 15 Trending hashtags.
    
    Return JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING },
          description: { type: Type.STRING },
          hashtags: { type: Type.STRING }
        },
        required: ["headline", "description", "hashtags"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function generateMatchImage(match: CricketMatch, promptOverride?: string): Promise<string> {
  const baseStyle = "Professional sport broadcast poster, photorealistic 8K, cinematic neon lighting, dynamic 3D perspective. ";
  const brandInstruction = "BRANDING: Place 'CrickMic' logo in top-left. ";
  const teamContext = `VISUAL: Use the primary colors and textures of ${match.teamA} and ${match.teamB}. `;
  const dynamicEffects = "EFFECTS: Kinetic motion blur, glowing geometric shards, and particle overlays. ";
  
  let contentCue = `STADIUM: Epic atmospheric cricket stadium at night. `;
  const ctx = (promptOverride || "").toLowerCase();
  
  let overlayText = `Text overlay: '${match.teamA} vs ${match.teamB}'`;

  // Advanced parsing for Player Focus with Jersey and Stats
  if (ctx.includes("player focus") || ctx.includes("heroic performance")) {
    const playerMatch = promptOverride?.match(/PLAYER FOCUS: Heroic performance by (.*)\. Team: (.*)\. Stats: (.*) - (.*)\./);
    if (playerMatch) {
      const [_, name, teamName, score, details] = playerMatch;
      contentCue += `HERO SHOT: High-action close up of ${name} in a dynamic pose, explicitly wearing the professional team jersey and colors of ${teamName}. `;
      contentCue += `OVERLAY: Create a translucent, futuristic HUD/Stat-card in the lower-third displaying: Name: '${name.toUpperCase()}', Performance: '${score}', Stats: '${details}'. `;
      overlayText = `Big bold graphic text: '${name.toUpperCase()}' and '${score}'. `;
    } else {
      contentCue += "Action shot of a heroic player with sparks and light trails. ";
    }
  } else if (ctx.includes("summary")) {
    contentCue += "Wide cinematic view of the cricket field with a neon summary board showing key moments. ";
  } else if (ctx.includes("batter") || ctx.includes("century") || ctx.includes("runs")) {
    contentCue += "Action shot of a heroic batter hitting a massive six with sparks flying. ";
  } else if (ctx.includes("bowler") || ctx.includes("wicket")) {
    contentCue += "Action shot of a fast bowler celebrating a clean bowled wicket with splintering stumps. ";
  } else {
    contentCue += "Wide angle cinematic view of a glowing cricket pitch with 3D scoreboard numbers in the air. ";
  }

  const prompt = `${baseStyle} ${brandInstruction} ${teamContext} ${dynamicEffects} ${contentCue} ${overlayText}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "https://images.unsplash.com/photo-1540747913346-19e3adcc174b?auto=format&fit=crop&q=80&w=1200"; 
}
